import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    width: 100%;
    max-width: 100%;
    ${tw`px-4`};

    ${breakpoint('xl')`
        ${tw`px-8`};
    `};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
