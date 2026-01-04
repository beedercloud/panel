import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import {
    BanIcon,
    PlayIcon,
    RefreshIcon,
    StopIcon,
} from '@heroicons/react/outline';
import buttonStyles from '@/components/elements/button/style.module.css';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <Button
                    className={`${buttonStyles.pill} w-full sm:w-auto shadow-lg ring-1 ring-white/10 gap-2`}
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                    aria-label={'Start'}
                    title={'Start'}
                >
                    <PlayIcon className={'w-5 h-5'} />
                    <span className={'text-sm font-semibold'}>Start</span>
                </Button>
            </Can>
            <Can action={'control.restart'}>
                <Button.Text
                    className={`${buttonStyles.pill} w-full sm:w-auto shadow-lg ring-1 ring-white/10 gap-2`}
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                    aria-label={'Restart'}
                    title={'Restart'}
                >
                    <RefreshIcon className={'w-5 h-5'} />
                    <span className={'text-sm font-semibold'}>Restart</span>
                </Button.Text>
            </Can>
            <Can action={'control.stop'}>
                <Button.Danger
                    className={`${buttonStyles.pill} w-full sm:w-auto shadow-lg ring-1 ring-white/10 gap-2`}
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    aria-label={killable ? 'Kill' : 'Stop'}
                    title={killable ? 'Kill' : 'Stop'}
                >
                    {killable ? <BanIcon className={'w-5 h-5'} /> : <StopIcon className={'w-5 h-5'} />}
                    <span className={'text-sm font-semibold'}>{killable ? 'Kill' : 'Stop'}</span>
                </Button.Danger>
            </Can>
        </div>
    );
};
