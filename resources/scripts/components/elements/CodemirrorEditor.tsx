import React, { useCallback, useEffect, useRef, useState } from 'react';
import CodeMirror from 'codemirror';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import modes from '@/modes';

require('codemirror/lib/codemirror.css');
require('codemirror/theme/ayu-mirage.css');
require('codemirror/addon/edit/closebrackets');
require('codemirror/addon/edit/closetag');
require('codemirror/addon/edit/matchbrackets');
require('codemirror/addon/edit/matchtags');
require('codemirror/addon/edit/trailingspace');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter.css');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/addon/fold/comment-fold');
require('codemirror/addon/fold/indent-fold');
require('codemirror/addon/fold/markdown-fold');
require('codemirror/addon/fold/xml-fold');
require('codemirror/addon/hint/css-hint');
require('codemirror/addon/hint/html-hint');
require('codemirror/addon/hint/javascript-hint');
require('codemirror/addon/hint/show-hint.css');
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/sql-hint');
require('codemirror/addon/hint/xml-hint');
require('codemirror/addon/mode/simple');
require('codemirror/addon/dialog/dialog.css');
require('codemirror/addon/dialog/dialog');
require('codemirror/addon/scroll/annotatescrollbar');
require('codemirror/addon/scroll/scrollpastend');
require('codemirror/addon/scroll/simplescrollbars.css');
require('codemirror/addon/scroll/simplescrollbars');
require('codemirror/addon/search/jump-to-line');
require('codemirror/addon/search/match-highlighter');
require('codemirror/addon/search/matchesonscrollbar.css');
require('codemirror/addon/search/matchesonscrollbar');
require('codemirror/addon/search/search');
require('codemirror/addon/search/searchcursor');

require('codemirror/mode/brainfuck/brainfuck');
require('codemirror/mode/clike/clike');
require('codemirror/mode/css/css');
require('codemirror/mode/dart/dart');
require('codemirror/mode/diff/diff');
require('codemirror/mode/dockerfile/dockerfile');
require('codemirror/mode/erlang/erlang');
require('codemirror/mode/gfm/gfm');
require('codemirror/mode/go/go');
require('codemirror/mode/handlebars/handlebars');
require('codemirror/mode/htmlembedded/htmlembedded');
require('codemirror/mode/htmlmixed/htmlmixed');
require('codemirror/mode/http/http');
require('codemirror/mode/javascript/javascript');
require('codemirror/mode/jsx/jsx');
require('codemirror/mode/julia/julia');
require('codemirror/mode/lua/lua');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/nginx/nginx');
require('codemirror/mode/perl/perl');
require('codemirror/mode/php/php');
require('codemirror/mode/properties/properties');
require('codemirror/mode/protobuf/protobuf');
require('codemirror/mode/pug/pug');
require('codemirror/mode/python/python');
require('codemirror/mode/rpm/rpm');
require('codemirror/mode/ruby/ruby');
require('codemirror/mode/rust/rust');
require('codemirror/mode/sass/sass');
require('codemirror/mode/shell/shell');
require('codemirror/mode/smarty/smarty');
require('codemirror/mode/sql/sql');
require('codemirror/mode/swift/swift');
require('codemirror/mode/toml/toml');
require('codemirror/mode/twig/twig');
require('codemirror/mode/vue/vue');
require('codemirror/mode/xml/xml');
require('codemirror/mode/yaml/yaml');

const EditorContainer = styled.div`
    min-height: 16rem;
    height: calc(100vh - 20rem);
    ${tw`relative`};

    > div {
        ${tw`h-full`};
        border-radius: var(--radius-lg);
        border: 1px solid var(--border);
        background: var(--card);
        overflow: hidden;
        box-shadow: 0 18px 32px rgba(5, 8, 12, 0.4);
    }

    .CodeMirror {
        height: 100%;
        background: var(--card);
        color: var(--text-primary);
        font-size: 12px;
        line-height: 1.375rem;
    }

    .CodeMirror-scroll {
        background: transparent;
    }

    .CodeMirror-gutters {
        background: var(--panel);
        border-right: 1px solid var(--divider);
    }

    .CodeMirror-linenumber {
        color: var(--text-muted);
        padding: 1px 12px 0 12px !important;
    }

    .CodeMirror-foldmarker {
        color: var(--text-secondary);
        text-shadow: none;
        margin-left: 0.25rem;
        margin-right: 0.25rem;
    }

    .CodeMirror-guttermarker,
    .CodeMirror-guttermarker-subtle {
        color: var(--text-muted);
    }

    .CodeMirror-selected {
        background: rgba(255, 183, 3, 0.14) !important;
    }

    .CodeMirror-line::selection,
    .CodeMirror-line > span::selection,
    .CodeMirror-line > span > span::selection {
        background: rgba(255, 183, 3, 0.16);
    }

    .CodeMirror-cursor {
        border-left: 2px solid var(--accent);
    }

    .CodeMirror-activeline-background {
        background: rgba(32, 39, 52, 0.45);
    }

    .CodeMirror-matchingbracket {
        color: var(--accent) !important;
        background: rgba(255, 183, 3, 0.12);
    }

    .CodeMirror-nonmatchingbracket {
        color: var(--error) !important;
    }
`;

export interface Props {
    style?: React.CSSProperties;
    initialContent?: string;
    mode: string;
    filename?: string;
    onModeChanged: (mode: string) => void;
    fetchContent: (callback: () => Promise<string>) => void;
    onContentSaved: () => void;
    onEditorReady?: (editor: CodeMirror.Editor) => void;
}

const findModeByFilename = (filename: string) => {
    for (let i = 0; i < modes.length; i++) {
        const info = modes[i];

        if (info.file && info.file.test(filename)) {
            return info;
        }
    }

    const dot = filename.lastIndexOf('.');
    const ext = dot > -1 && filename.substring(dot + 1, filename.length);

    if (ext) {
        for (let i = 0; i < modes.length; i++) {
            const info = modes[i];
            if (info.ext) {
                for (let j = 0; j < info.ext.length; j++) {
                    if (info.ext[j] === ext) {
                        return info;
                    }
                }
            }
        }
    }

    return undefined;
};

export default ({
    style,
    initialContent,
    filename,
    mode,
    fetchContent,
    onContentSaved,
    onModeChanged,
    onEditorReady,
}: Props) => {
    const [editor, setEditor] = useState<CodeMirror.Editor>();
    const editorRef = useRef<CodeMirror.Editor | null>(null);
    const onEditorReadyRef = useRef<typeof onEditorReady>(onEditorReady);
    onEditorReadyRef.current = onEditorReady;

    const ref = useCallback(
        (node) => {
            if (!node || editorRef.current) return;

            const e = CodeMirror.fromTextArea(node, {
                mode: 'text/plain',
                theme: 'ayu-mirage',
                indentUnit: 4,
                smartIndent: true,
                tabSize: 4,
                indentWithTabs: false,
                lineWrapping: true,
                lineNumbers: true,
                foldGutter: true,
                fixedGutter: true,
                scrollbarStyle: 'overlay',
                coverGutterNextToScrollbar: false,
                readOnly: false,
                showCursorWhenSelecting: false,
                autofocus: false,
                spellcheck: true,
                autocorrect: false,
                autocapitalize: false,
                lint: false,
                // @ts-expect-error this property is actually used, the d.ts file for CodeMirror is incorrect.
                autoCloseBrackets: true,
                matchBrackets: true,
                gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            });

            editorRef.current = e;
            setEditor(e);
            onEditorReadyRef.current?.(e);
        },
        []
    );

    useEffect(() => {
        if (filename === undefined) {
            return;
        }

        onModeChanged(findModeByFilename(filename)?.mime || 'text/plain');
    }, [filename]);

    useEffect(() => {
        editor && editor.setOption('mode', mode);
    }, [editor, mode]);

    useEffect(() => {
        if (editor) {
            editor.setValue(initialContent || '');
            // Reset the history so that "Ctrl+Z" doesn't delete the intial content
            // we just set above.
            editor.setHistory({ done: [], undone: [] });
        }
    }, [editor, initialContent]);

    useEffect(() => {
        if (!editor) {
            fetchContent(() => Promise.reject(new Error('no editor session has been configured')));
            return;
        }

        editor.addKeyMap({
            'Ctrl-S': () => onContentSaved(),
            'Cmd-S': () => onContentSaved(),
        });

        fetchContent(() => Promise.resolve(editor.getValue()));
    }, [editor, fetchContent, onContentSaved]);

    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.toTextArea();
                editorRef.current = null;
            }
        };
    }, []);

    return (
        <EditorContainer style={style}>
            <textarea ref={ref} />
        </EditorContainer>
    );
};
