import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink, useLocation, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArchive,
    faBars,
    faBolt,
    faCogs,
    faDatabase,
    faFileAlt,
    faFolderOpen,
    faHistory,
    faKey,
    faLock,
    faNetworkWired,
    faSlidersH,
    faTachometerAlt,
    faTerminal,
    faUserCircle,
    faUsers,
    faSignOutAlt,
} from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw, { theme } from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/solid';
import classNames from 'classnames';
import Avatar from '@/components/Avatar';
import routes from '@/routers/routes';
import Can from '@/components/elements/Can';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import logo from '@/assets/images/logo.png';

const Sidebar = styled.aside`
    ${tw`sticky top-0 h-screen flex flex-col flex-shrink-0 border-r z-40`};
    background: var(--panel);
    border-color: var(--border);
    transition: width 180ms ease;
    will-change: width;
    contain: layout paint;

    @media (max-width: 1024px) {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        width: min(82vw, 320px);
        transform: translateX(-100%);
        transition: transform 220ms ease;
        will-change: transform;
        box-shadow: 0 30px 70px rgba(0, 0, 0, 0.55);
    }

    &.mobile-open {
        transform: translateX(0);
    }
`;

const NavGroup = styled.div`
    ${tw`flex flex-col gap-2 px-3`};
`;

const NavItem = styled.div`
    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex items-center gap-3 w-full text-left no-underline px-3 py-2 rounded-xl cursor-pointer`};
        color: var(--text-secondary);
        transition: color 150ms ease, background-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;

        &:hover {
            background: var(--elevated);
            color: var(--text-primary);
            transform: translateX(2px);
        }

        &:active,
        &.active {
            background: linear-gradient(90deg, rgba(246, 194, 48, 0.22), rgba(246, 194, 48, 0.06));
            box-shadow: inset 0 0 0 1px var(--accent);
            color: var(--text-primary);
        }
    }

    &.nav-collapsed > a,
    &.nav-collapsed > button,
    &.nav-collapsed > .navigation-link {
        ${tw`justify-center px-2 gap-0`};
    }

    & .nav-label {
        ${tw`text-sm whitespace-nowrap overflow-hidden`};
        transition: opacity 120ms ease, transform 120ms ease;
        max-width: 160px;
        opacity: 1;
        transform: translateX(0);
    }

    &.nav-collapsed .nav-label {
        max-width: 0;
        opacity: 0;
        transform: translateX(-6px);
    }
`;

const SidebarDivider = styled.div`
    ${tw`mx-3 my-2 h-px`};
    background: var(--divider);
`;

const navIcons: Record<string, any> = {
    Account: faUserCircle,
    'API Credentials': faKey,
    'SSH Keys': faLock,
    Activity: faHistory,
    Console: faTerminal,
    Files: faFolderOpen,
    Databases: faDatabase,
    Schedules: faBolt,
    Users: faUsers,
    Backups: faArchive,
    Network: faNetworkWired,
    Startup: faBolt,
    Settings: faSlidersH,
};

export default () => {
    const name = useStoreState((state: ApplicationStore) => state.settings.data!.name);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    const username = useStoreState((state: ApplicationStore) => state.user.data!.username);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();
    const serverMatch = useRouteMatch<{ id: string }>('/server/:id');
    const hasContextNav = location.pathname.startsWith('/account') || !!serverMatch;

    React.useEffect(() => {
        if (!isAnimating) return;
        const timer = setTimeout(() => setIsAnimating(false), 220);
        return () => clearTimeout(timer);
    }, [isAnimating]);

    React.useEffect(() => {
        const media = window.matchMedia('(max-width: 1024px)');
        const onChange = () => setIsMobile(media.matches);

        onChange();

        if (media.addEventListener) {
            media.addEventListener('change', onChange);
            return () => media.removeEventListener('change', onChange);
        }

        media.addListener(onChange);
        return () => media.removeListener(onChange);
    }, []);

    React.useEffect(() => {
        if (!isMobile) return;
        setMobileOpen(false);
    }, [isMobile, location.pathname]);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const sidebarCollapsed = collapsed && !isMobile;

    return (
        <>
            {isMobile && mobileOpen && (
                <button
                    type={'button'}
                    className={'fixed inset-0 z-30 cursor-default bg-black/50'}
                    onClick={() => setMobileOpen(false)}
                    aria-label={'Close navigation'}
                />
            )}
            {isMobile && !mobileOpen && (
                <button
                    type={'button'}
                    className={
                        'fixed left-4 top-4 z-50 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--panel)] text-[var(--text-primary)] shadow-lg'
                    }
                    onClick={() => setMobileOpen(true)}
                    aria-label={'Open navigation'}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            )}
            <Sidebar
                className={classNames(
                    !isMobile && (sidebarCollapsed ? 'w-20' : 'w-64'),
                    isMobile && 'mobile-nav',
                    isMobile && mobileOpen && 'mobile-open',
                    !isMobile && !isAnimating && 'backdrop-blur'
                )}
                aria-hidden={isMobile && !mobileOpen}
            >
            <SpinnerOverlay visible={isLoggingOut} />
            <div
                className={classNames(
                    'flex items-center h-12 sm:h-14',
                    sidebarCollapsed ? 'px-2 justify-between' : 'px-4 gap-3'
                )}
            >
                <img
                    src={logo}
                    alt={`${name} logo`}
                    className={classNames('object-contain', sidebarCollapsed ? 'h-8 w-8' : 'h-9 w-9')}
                />
                {!sidebarCollapsed && (
                    <Link to={'/'} className={'text-base font-header font-semibold text-[var(--text-primary)] no-underline'}>
                        {name}
                    </Link>
                )}
                <button
                    className={classNames(
                        'h-8 w-8 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--elevated)] transition',
                        sidebarCollapsed ? '' : 'ml-auto'
                    )}
                    onClick={() => {
                        if (isMobile) {
                            setMobileOpen((state) => !state);
                            return;
                        }

                        setIsAnimating(true);
                        setCollapsed((state) => !state);
                    }}
                    aria-label={'Toggle sidebar'}
                    title={'Toggle sidebar'}
                >
                    <FontAwesomeIcon icon={faBars} />
                </button>
            </div>
            <div className={'flex flex-col flex-1 min-h-0'}>
                <div className={'flex-1 min-h-0 overflow-y-auto pb-4'}>
                    <NavGroup>
                        <NavItem className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                            <SearchContainer showLabel={!sidebarCollapsed} />
                        </NavItem>
                        <NavItem className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                            {sidebarCollapsed ? (
                                <Tooltip placement={'right'} content={'Dashboard'}>
                                    <NavLink to={'/'} exact>
                                        <FontAwesomeIcon icon={faTachometerAlt} />
                                        <span className={'nav-label'}>Dashboard</span>
                                    </NavLink>
                                </Tooltip>
                            ) : (
                                <NavLink to={'/'} exact>
                                    <FontAwesomeIcon icon={faTachometerAlt} />
                                    <span className={'nav-label'}>Dashboard</span>
                                </NavLink>
                            )}
                        </NavItem>
                        {rootAdmin && (
                            <NavItem className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                                {sidebarCollapsed ? (
                                    <Tooltip placement={'right'} content={'Admin'}>
                                        <a href={'/admin'} rel={'noreferrer'}>
                                            <FontAwesomeIcon icon={faCogs} />
                                            <span className={'nav-label'}>Admin</span>
                                        </a>
                                    </Tooltip>
                                ) : (
                                    <a href={'/admin'} rel={'noreferrer'}>
                                        <FontAwesomeIcon icon={faCogs} />
                                        <span className={'nav-label'}>Admin</span>
                                    </a>
                                )}
                            </NavItem>
                        )}
                    </NavGroup>
                    <SidebarDivider />
                    {location.pathname.startsWith('/account') && (
                        <NavGroup>
                            {routes.account
                                .filter((route) => !!route.name)
                                .map(({ path, name: routeName, exact = false }) => (
                                    <NavItem key={path} className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                                        {sidebarCollapsed ? (
                                            <Tooltip placement={'right'} content={routeName}>
                                                <NavLink to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                                    <FontAwesomeIcon
                                                        icon={navIcons[routeName as string] || faUserCircle}
                                                    />
                                                    <span className={'nav-label'}>{routeName}</span>
                                                </NavLink>
                                            </Tooltip>
                                        ) : (
                                            <NavLink to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                                <FontAwesomeIcon
                                                    icon={navIcons[routeName as string] || faUserCircle}
                                                />
                                                <span className={'nav-label'}>{routeName}</span>
                                            </NavLink>
                                        )}
                                    </NavItem>
                                ))}
                        </NavGroup>
                    )}
                    {serverMatch && (
                        <NavGroup>
                            {routes.server
                                .filter((route) => !!route.name)
                                .map((route) =>
                                    route.permission ? (
                                        <Can key={route.path} action={route.permission} matchAny>
                                            <NavItem className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                                                {sidebarCollapsed ? (
                                                    <Tooltip placement={'right'} content={route.name}>
                                                        <NavLink
                                                            to={`${serverMatch.url}${route.path}`}
                                                            exact={route.exact}
                                                        >
                                                            <FontAwesomeIcon
                                                                icon={navIcons[route.name as string] || faTerminal}
                                                            />
                                                            <span className={'nav-label'}>{route.name}</span>
                                                        </NavLink>
                                                    </Tooltip>
                                                ) : (
                                                    <NavLink to={`${serverMatch.url}${route.path}`} exact={route.exact}>
                                                        <FontAwesomeIcon
                                                            icon={navIcons[route.name as string] || faTerminal}
                                                        />
                                                        <span className={'nav-label'}>{route.name}</span>
                                                    </NavLink>
                                                )}
                                            </NavItem>
                                        </Can>
                                    ) : (
                                        <NavItem key={route.path} className={sidebarCollapsed ? 'nav-collapsed' : undefined}>
                                            {sidebarCollapsed ? (
                                                <Tooltip placement={'right'} content={route.name}>
                                                    <NavLink to={`${serverMatch.url}${route.path}`} exact={route.exact}>
                                                        <FontAwesomeIcon
                                                            icon={navIcons[route.name as string] || faTerminal}
                                                        />
                                                        <span className={'nav-label'}>{route.name}</span>
                                                    </NavLink>
                                                </Tooltip>
                                            ) : (
                                                <NavLink to={`${serverMatch.url}${route.path}`} exact={route.exact}>
                                                    <FontAwesomeIcon
                                                        icon={navIcons[route.name as string] || faTerminal}
                                                    />
                                                    <span className={'nav-label'}>{route.name}</span>
                                                </NavLink>
                                            )}
                                        </NavItem>
                                    )
                                )}
                        </NavGroup>
                    )}
                </div>
                <div className={'px-3 py-3'}>
                    <Menu as={'div'} className={'relative w-full'}>
                        <Menu.Button className={classNames('w-full', sidebarCollapsed ? 'flex justify-center' : '')}>
                            <div
                                className={classNames(
                                    'flex items-center w-full gap-3 rounded-xl border bg-[var(--elevated)] border-[var(--border)]',
                                    sidebarCollapsed ? 'p-2 justify-center min-h-[52px]' : 'px-3 py-2'
                                )}
                            >
                                <span className={'w-9 h-9 rounded-full overflow-hidden ring-1 ring-white/10'}>
                                    <Avatar.User variant={'beam'} size={36} />
                                </span>
                                {!sidebarCollapsed && (
                                    <>
                                        <div className={'flex-1 text-left'}>
                                            <div className={'text-sm font-semibold text-[var(--text-primary)]'}>
                                                {username}
                                            </div>
                                            <div className={'text-xs text-[var(--text-muted)]'}>Account</div>
                                        </div>
                                        <ChevronDownIcon className={'w-4 h-4 text-[var(--text-muted)]'} />
                                    </>
                                )}
                            </div>
                        </Menu.Button>
                        <Transition
                            enter={'transition duration-100 ease-out'}
                            enterFrom={'transform scale-95 opacity-0'}
                            enterTo={'transform scale-100 opacity-100'}
                            leave={'transition duration-75 ease-out'}
                            leaveFrom={'transform scale-100 opacity-100'}
                            leaveTo={'transform scale-95 opacity-0'}
                        >
                            <Menu.Items
                                className={
                                    'absolute right-0 bottom-full mb-2 w-56 rounded-xl bg-[var(--panel)] border border-[var(--border)] shadow-xl z-20'
                                }
                            >
                                <div className={'px-1 py-1'}>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                className={classNames(
                                                    'flex items-center w-full px-3 py-2 rounded-lg text-left text-sm',
                                                    active
                                                        ? 'bg-[var(--elevated)] text-[var(--text-primary)]'
                                                        : 'text-[var(--text-secondary)]'
                                                )}
                                                onClick={() => {
                                                    // @ts-expect-error window location is fine here
                                                    window.location = '/account';
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faUserCircle} className={'w-4 h-4 mr-3'} />
                                                Account
                                            </button>
                                        )}
                                    </Menu.Item>
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                className={classNames(
                                                    'flex items-center w-full px-3 py-2 rounded-lg text-left text-sm',
                                                    active ? 'bg-red-600 text-white' : 'text-red-300'
                                                )}
                                                onClick={onTriggerLogout}
                                            >
                                                <FontAwesomeIcon icon={faSignOutAlt} className={'w-4 h-4 mr-3'} />
                                                Sign Out
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            </div>
            </Sidebar>
        </>
    );
};
