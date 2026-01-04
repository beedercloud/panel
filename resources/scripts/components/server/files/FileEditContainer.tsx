import React, { useEffect, useRef, useState } from 'react';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import saveFileContents from '@/api/server/files/saveFileContents';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { useHistory, useLocation, useParams } from 'react-router';
import FileNameModal from '@/components/server/files/FileNameModal';
import Can from '@/components/elements/Can';
import FlashMessageRender from '@/components/FlashMessageRender';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import Button from '@/components/elements/Button';
import Select from '@/components/elements/Select';
import modes from '@/modes';
import useFlash from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { encodePathSegments, hashToPath } from '@/helpers';
import { dirname } from 'pathe';
import CodemirrorEditor from '@/components/elements/CodemirrorEditor';
import { css } from 'styled-components/macro';
import Icon from '@/components/elements/Icon';
import type CodeMirror from 'codemirror';
import { faArrowLeft, faRedo, faUndo } from '@fortawesome/free-solid-svg-icons';

const editorControlStyles = css`
    border-radius: 9999px;
    background-color: var(--panel-strong);
    border: 1px solid var(--border);
    color: var(--text-primary);
    min-height: 40px;
    padding: 0.55rem 1rem;
`;

const editorPrimaryButtonStyles = css`
    border-radius: 9999px;
    background: var(--accent-strong);
    border-color: var(--accent-active);
    color: var(--text-on-primary);
    min-height: 40px;
    padding: 0.55rem 1.25rem;

    &:hover:not(:disabled) {
        background: var(--accent-hover);
        border-color: var(--accent-hover);
    }

    &:active:not(:disabled) {
        background: var(--accent-active);
        border-color: var(--accent-active);
    }
`;

const editorIconButtonStyles = css`
    ${tw`inline-flex items-center justify-center`};
    width: 34px;
    height: 34px;
    border-radius: 9999px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-muted);
    transition: color 150ms ease, transform 150ms ease;

    &:hover:not(:disabled) {
        color: var(--text-primary);
    }

    &:active:not(:disabled) {
        transform: translateY(1px);
    }
`;

export default () => {
    const [error, setError] = useState('');
    const { action } = useParams<{ action: 'new' | string }>();
    const [loading, setLoading] = useState(action === 'edit');
    const [content, setContent] = useState('');
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('text/plain');

    const history = useHistory();
    const { hash } = useLocation();

    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const { addError, clearFlashes } = useFlash();
    const editorRef = useRef<CodeMirror.Editor | null>(null);

    let fetchFileContent: null | (() => Promise<string>) = null;

    const goBackToDirectory = () => {
        const path = hashToPath(hash);
        const parent = dirname(path);

        if (!parent || parent === '.' || parent === '/') {
            history.push(`/server/${id}/files`);
            return;
        }

        history.push(`/server/${id}/files#${encodePathSegments(parent)}`);
    };

    useEffect(() => {
        if (action === 'new') return;

        setError('');
        setLoading(true);
        const path = hashToPath(hash);
        setDirectory(dirname(path));
        getFileContents(uuid, path)
            .then(setContent)
            .catch((error) => {
                console.error(error);
                setError(httpErrorToHuman(error));
            })
            .then(() => setLoading(false));
    }, [action, uuid, hash]);

    const save = (name?: string) => {
        if (!fetchFileContent) {
            return;
        }

        setLoading(true);
        clearFlashes('files:view');
        fetchFileContent()
            .then((content) => saveFileContents(uuid, name || hashToPath(hash), content))
            .then(() => {
                if (name) {
                    history.push(`/server/${id}/files/edit#/${encodePathSegments(name)}`);
                    return;
                }

                return Promise.resolve();
            })
            .catch((error) => {
                console.error(error);
                addError({ message: httpErrorToHuman(error), key: 'files:view' });
            })
            .then(() => setLoading(false));
    };

    if (error) {
        return <ServerError message={error} onBack={() => history.goBack()} />;
    }

    return (
        <PageContentBlock>
            <FlashMessageRender byKey={'files:view'} css={tw`mb-4`} />
            <ErrorBoundary>
                <div css={tw`mb-4`}>
                    <FileManagerBreadcrumbs
                        withinFileEditor
                        isNewFile={action !== 'edit'}
                        renderLeft={
                            <div css={tw`w-12 flex items-center justify-center`}>
                                <button
                                    type={'button'}
                                    css={editorIconButtonStyles}
                                    onClick={goBackToDirectory}
                                    aria-label={'Back to folder'}
                                    title={'Back to folder'}
                                >
                                    <Icon icon={faArrowLeft} className={'w-4 h-4'} />
                                </button>
                            </div>
                        }
                    />
                </div>
            </ErrorBoundary>
            {hash.replace(/^#/, '').endsWith('.pteroignore') && (
                <div css={tw`mb-4 p-4 border-l-4 bg-neutral-900 rounded border-cyan-400`}>
                    <p css={tw`text-neutral-300 text-sm`}>
                        You&apos;re editing a <code css={tw`font-mono bg-black rounded py-px px-1`}>.pteroignore</code>{' '}
                        file. Any files or directories listed in here will be excluded from backups. Wildcards are
                        supported by using an asterisk (<code css={tw`font-mono bg-black rounded py-px px-1`}>*</code>).
                        You can negate a prior rule by prepending an exclamation point (
                        <code css={tw`font-mono bg-black rounded py-px px-1`}>!</code>).
                    </p>
                </div>
            )}
            <FileNameModal
                visible={modalVisible}
                onDismissed={() => setModalVisible(false)}
                onFileNamed={(name) => {
                    setModalVisible(false);
                    save(name);
                }}
            />
            <div css={tw`relative`}>
                <SpinnerOverlay visible={loading} />
                <CodemirrorEditor
                    mode={mode}
                    filename={hash.replace(/^#/, '')}
                    onModeChanged={setMode}
                    initialContent={content}
                    onEditorReady={(instance) => {
                        editorRef.current = instance;
                    }}
                    fetchContent={(value) => {
                        fetchFileContent = value;
                    }}
                    onContentSaved={() => {
                        if (action !== 'edit') {
                            setModalVisible(true);
                        } else {
                            save();
                        }
                    }}
                />
            </div>
            <div css={tw`flex flex-col gap-4 mt-4 sm:flex-row sm:items-center sm:justify-end`}>
                <div css={tw`flex items-center gap-3`}>
                    <button
                        type={'button'}
                        css={editorIconButtonStyles}
                        onClick={() => editorRef.current?.undo()}
                        aria-label={'Undo'}
                        title={'Undo'}
                    >
                        <Icon icon={faUndo} className={'w-4 h-4'} />
                    </button>
                    <button
                        type={'button'}
                        css={editorIconButtonStyles}
                        onClick={() => editorRef.current?.redo()}
                        aria-label={'Redo'}
                        title={'Redo'}
                    >
                        <Icon icon={faRedo} className={'w-4 h-4'} />
                    </button>
                </div>
                <div css={tw`w-full sm:w-auto`}>
                    <Select
                        value={mode}
                        css={editorControlStyles}
                        onChange={(e) => setMode(e.currentTarget.value)}
                    >
                        {modes.map((mode) => (
                            <option key={`${mode.name}_${mode.mime}`} value={mode.mime}>
                                {mode.name}
                            </option>
                        ))}
                    </Select>
                </div>
                {action === 'edit' ? (
                    <Can action={'file.update'}>
                        <Button css={[tw`w-full sm:w-auto`, editorPrimaryButtonStyles]} onClick={() => save()}>
                            Save Content
                        </Button>
                    </Can>
                ) : (
                    <Can action={'file.create'}>
                        <Button
                            css={[tw`w-full sm:w-auto`, editorPrimaryButtonStyles]}
                            onClick={() => setModalVisible(true)}
                        >
                            Create File
                        </Button>
                    </Can>
                )}
            </div>
        </PageContentBlock>
    );
};
