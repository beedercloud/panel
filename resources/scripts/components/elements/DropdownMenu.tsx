import React, { createRef } from 'react';
import styled, { css } from 'styled-components/macro';
import tw from 'twin.macro';
import Fade from '@/components/elements/Fade';

interface Props {
    children: React.ReactNode;
    renderToggle: (onClick: (e: React.MouseEvent<any, MouseEvent>) => void) => React.ReactChild;
}

export const DropdownButtonRow = styled.button<{ danger?: boolean }>`
    ${tw`p-2 flex items-center rounded w-full text-sm`};
    color: var(--text-secondary);
    transition: 150ms all ease;

    &:hover {
        color: var(--text-primary);
        background: var(--panel-strong);
    }

    ${(props) =>
        props.danger &&
        css`
            &:hover {
                color: var(--error);
                background: rgba(239, 68, 68, 0.14);
            }
        `};
`;

const MenuContainer = styled.div`
    ${tw`fixed p-2 z-50`};
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.45);
    color: var(--text-secondary);
`;

interface State {
    posX: number;
    posY: number;
    visible: boolean;
}

class DropdownMenu extends React.PureComponent<Props, State> {
    menu = createRef<HTMLDivElement>();

    state: State = {
        posX: 0,
        posY: 0,
        visible: false,
    };

    componentWillUnmount() {
        this.removeListeners();
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
        const menu = this.menu.current;

        if (this.state.visible && !prevState.visible && menu) {
            document.addEventListener('click', this.windowListener);
            document.addEventListener('contextmenu', this.contextMenuListener);
            const padding = 8;
            const width = menu.clientWidth;
            const height = menu.clientHeight;
            const maxX = window.innerWidth - padding;
            const maxY = window.innerHeight - padding;

            let left = Math.round(this.state.posX - width);
            let top = Math.round(this.state.posY);

            if (left < padding) left = padding;
            if (left + width > maxX) left = Math.max(padding, maxX - width);
            if (top + height > maxY) top = Math.max(padding, this.state.posY - height);

            menu.style.left = `${left}px`;
            menu.style.top = `${top}px`;
        }

        if (!this.state.visible && prevState.visible) {
            this.removeListeners();
        }
    }

    removeListeners = () => {
        document.removeEventListener('click', this.windowListener);
        document.removeEventListener('contextmenu', this.contextMenuListener);
    };

    onClickHandler = (e: React.MouseEvent<any, MouseEvent>) => {
        e.preventDefault();
        this.triggerMenu({ x: e.clientX, y: e.clientY });
    };

    contextMenuListener = () => this.setState({ visible: false });

    windowListener = (e: MouseEvent) => {
        const menu = this.menu.current;

        if (e.button === 2 || !this.state.visible || !menu) {
            return;
        }

        if (e.target === menu || menu.contains(e.target as Node)) {
            return;
        }

        if (e.target !== menu && !menu.contains(e.target as Node)) {
            this.setState({ visible: false });
        }
    };

    triggerMenu = (pos: { x: number; y: number }) =>
        this.setState((s) => ({
            posX: !s.visible ? pos.x : s.posX,
            posY: !s.visible ? pos.y : s.posY,
            visible: !s.visible,
        }));

    render() {
        return (
            <div>
                {this.props.renderToggle(this.onClickHandler)}
                <Fade timeout={150} in={this.state.visible} unmountOnExit>
                    <MenuContainer
                        ref={this.menu}
                        onClick={(e) => {
                            e.stopPropagation();
                            this.setState({ visible: false });
                        }}
                        style={{ width: '12rem' }}
                    >
                        {this.props.children}
                    </MenuContainer>
                </Fade>
            </div>
        );
    }
}

export default DropdownMenu;
