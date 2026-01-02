import axios, { AxiosProgressEvent } from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import React, { useEffect, useRef, useState } from 'react';
import useEventListener from '@/plugins/useEventListener';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import { WithClassname } from '@/components/types';
import { CloudUploadIcon } from '@heroicons/react/outline';
import createDirectory from '@/api/server/files/createDirectory';
import { dirname, join } from 'pathe';
import Modal from '@/components/elements/Modal';
import buttonStyles from '@/components/elements/button/style.module.css';

function isFileOrDirectory(event: DragEvent): boolean {
    if (!event.dataTransfer?.types) {
        return false;
    }

    return event.dataTransfer.types.some((value) => value.toLowerCase() === 'files');
}

export default ({ className }: WithClassname) => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const folderUploadInput = useRef<HTMLInputElement>(null);
    const timeouts = useRef<NodeJS.Timeout[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    const { mutate } = useFileManagerSwr();
    const { addError, clearAndAddHttpError } = useFlashKey('files');

    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, removeFileUpload, pushFileUpload, setUploadProgress } = ServerContext.useStoreActions(
        (actions) => actions.files
    );

    useEventListener(
        'dragenter',
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isFileOrDirectory(e)) {
                setModalOpen(true);
                setDragActive(true);
            }
        },
        { capture: true }
    );

    useEventListener(
        'dragover',
        (e) => {
            if (isFileOrDirectory(e)) {
                e.preventDefault();
            }
        },
        { capture: true }
    );

    useEventListener('dragleave', () => setDragActive(false), { capture: true });

    useEventListener('drop', () => setDragActive(false), { capture: true });

    useEventListener('keydown', () => setDragActive(false));

    useEffect(() => {
        return () => timeouts.current.forEach(clearTimeout);
    }, []);

    const onUploadProgress = (data: AxiosProgressEvent, name: string) => {
        setUploadProgress({ name, loaded: data.loaded });
    };

    const ensureDirectories = async (paths: string[]) => {
        const directories = new Set<string>();

        paths.forEach((path) => {
            const relativeDir = dirname(path);
            if (!relativeDir || relativeDir === '.') {
                return;
            }

            relativeDir
                .split('/')
                .filter(Boolean)
                .reduce((acc, segment) => {
                    const next = acc ? `${acc}/${segment}` : segment;
                    directories.add(next);
                    return next;
                }, '');
        });

        const ordered = Array.from(directories).sort((a, b) => a.split('/').length - b.split('/').length);

        for (const relativeDir of ordered) {
            const parts = relativeDir.split('/');
            const name = parts.pop()!;
            const root = join(directory, parts.join('/'));

            try {
                await createDirectory(uuid, root, name);
            } catch (error) {
                // Ignore errors creating directories that already exist.
            }
        }
    };

    const onFileSubmission = async (files: FileList) => {
        clearAndAddHttpError();
        const list = Array.from(files);
        if (!list.length) return;

        const relativePaths = list.map((file) => file.webkitRelativePath || file.name);
        await ensureDirectories(relativePaths);
        setModalOpen(false);

        const uploads = list.map((file) => {
            const relativePath = file.webkitRelativePath || file.name;
            const relativeDir = dirname(relativePath);
            const uploadDirectory = relativeDir && relativeDir !== '.' ? join(directory, relativeDir) : directory;
            const controller = new AbortController();
            pushFileUpload({
                name: relativePath,
                data: { abort: controller, loaded: 0, total: file.size },
            });

            return () =>
                getFileUploadUrl(uuid).then((url) =>
                    axios
                        .post(
                            url,
                            { files: file },
                            {
                                signal: controller.signal,
                                headers: { 'Content-Type': 'multipart/form-data' },
                                params: { directory: uploadDirectory },
                                onUploadProgress: (data) => onUploadProgress(data, relativePath),
                            }
                        )
                        .then(() => timeouts.current.push(setTimeout(() => removeFileUpload(relativePath), 500)))
                );
        });

        Promise.all(uploads.map((fn) => fn()))
            .then(() => mutate())
            .catch((error) => {
                clearFileUploads();
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <Modal visible={modalOpen} onDismissed={() => setModalOpen(false)} closeOnBackground>
                <div
                    css={tw`flex flex-col items-center text-center space-y-4`}
                    onDragOver={(e) => {
                        e.preventDefault();
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        setDragActive(false);
                        if (!e.dataTransfer?.files.length) return;
                        onFileSubmission(e.dataTransfer.files);
                    }}
                >
                    <div
                        css={[tw`w-full border-2 border-dashed rounded-2xl px-8 py-10`]}
                        style={{
                            borderColor: dragActive ? 'var(--accent)' : 'var(--border)',
                            background: dragActive ? 'rgba(31, 38, 48, 0.7)' : 'var(--panel-strong)',
                        }}
                    >
                        <CloudUploadIcon
                            className={'w-12 h-12 mx-auto'}
                            style={{ color: dragActive ? 'var(--accent)' : 'var(--text-secondary)' }}
                        />
                        <p css={tw`mt-4 text-base`} style={{ color: 'var(--text-primary)' }}>
                            Drag & drop files or folders here
                        </p>
                        <p css={tw`mt-1 text-sm`} style={{ color: 'var(--text-secondary)' }}>
                            or choose an option below to upload
                        </p>
                    </div>
                    <div css={tw`flex items-center justify-center gap-3 flex-wrap`}>
                        <Button className={buttonStyles.pill} onClick={() => fileUploadInput.current?.click()}>
                            Select Files
                        </Button>
                        <Button className={buttonStyles.pill} onClick={() => folderUploadInput.current?.click()}>
                            Select Folder
                        </Button>
                    </div>
                    <p css={tw`text-xs`} style={{ color: 'var(--text-muted)' }}>
                        Supports multiple files and folders in one upload.
                    </p>
                </div>
            </Modal>
            <input
                type={'file'}
                ref={fileUploadInput}
                css={tw`hidden`}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;

                    onFileSubmission(e.currentTarget.files);
                    if (fileUploadInput.current) {
                        fileUploadInput.current.value = '';
                    }
                }}
                multiple
            />
            <input
                type={'file'}
                ref={folderUploadInput}
                css={tw`hidden`}
                multiple
                // @ts-expect-error vendor-specific directory upload attribute
                webkitdirectory={'true'}
                // @ts-expect-error non-standard attribute
                directory={'true'}
                onChange={(e) => {
                    if (!e.currentTarget.files) return;

                    onFileSubmission(e.currentTarget.files);
                    if (folderUploadInput.current) {
                        folderUploadInput.current.value = '';
                    }
                }}
            />
            <Button className={className} onClick={() => setModalOpen(true)}>
                Upload
            </Button>
        </>
    );
};
