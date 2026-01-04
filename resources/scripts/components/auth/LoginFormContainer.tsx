import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';
import logo from '@/assets/images/logo.png';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`w-full mx-auto px-4`};
    max-width: 460px;

    ${breakpoint('md')`
        ${tw`px-0`}
    `};
`;

const FormCard = styled.div`
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                0 0 0 1px rgba(255, 255, 255, 0.05) inset;
    position: relative;
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--accent), var(--accent-hover), var(--accent));
    }
`;

const LogoWrapper = styled.div`
    ${tw`flex justify-center mb-6`};

    img {
        height: 64px;
        width: auto;
        filter: drop-shadow(0 4px 12px rgba(246, 194, 48, 0.3));
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <FlashMessageRender css={tw`mb-4`} />
        <FormCard>
            <LogoWrapper>
                <img src={logo} alt={'Logo'} />
            </LogoWrapper>
            {title && (
                <h2
                    css={tw`text-2xl text-center font-semibold mb-6`}
                    style={{ color: 'var(--text-primary)' }}
                >
                    {title}
                </h2>
            )}
            <Form {...props} ref={ref}>
                {props.children}
            </Form>
        </FormCard>
        <p css={tw`text-center text-xs mt-6`} style={{ color: 'var(--text-muted)' }}>
            &copy; 2015 - {new Date().getFullYear()}&nbsp;
            <a
                rel={'noopener nofollow noreferrer'}
                href={'https://beedercloud.com'}
                target={'_blank'}
                css={tw`no-underline hover:underline`}
                style={{ color: 'var(--text-muted)' }}
            >
                BeederCloud
            </a>
        </p>
    </Container>
));
