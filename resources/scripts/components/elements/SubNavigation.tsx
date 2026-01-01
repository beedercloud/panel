import styled from 'styled-components/macro';
import tw, { theme } from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`w-full overflow-x-auto border-b border-neutral-800`};
    background: linear-gradient(90deg, rgba(17, 24, 39, 0.9), rgba(15, 23, 42, 0.9));

    & > div {
        ${tw`flex items-center text-sm px-4 py-2 gap-2`};

        & > a,
        & > div {
            ${tw`inline-flex items-center py-2 px-3 text-neutral-300 no-underline whitespace-nowrap transition-all duration-150 rounded-lg`};

            &:hover {
                ${tw`text-neutral-100 bg-neutral-800/70`};
            }

            &:active,
            &.active {
                ${tw`text-neutral-100`};
                background: ${theme`colors.cyan.600`.toString()}22;
                box-shadow: inset 0 0 0 1px ${theme`colors.cyan.600`.toString()};
            }
        }
    }
`;

export default SubNavigation;
