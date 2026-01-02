import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const ServerCard = styled(Link)`
    ${tw`relative block rounded-2xl p-4 no-underline transition`};
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--text-primary);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.35);

    &:hover {
        background: var(--elevated);
        border-color: var(--accent);
        transform: translateY(-1px);
    }
`;

type Timer = ReturnType<typeof setInterval>;

export default ({ server }: { server: Server }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? `${server.limits.cpu}%` : 'Unlimited';

    const cpuUsage = stats ? `${stats.cpuUsagePercent.toFixed(2)}%` : '--';
    const memoryUsage = stats ? bytesToString(stats.memoryUsageInBytes) : '--';
    const diskUsage = stats ? bytesToString(stats.diskUsageInBytes) : '--';

    let statusLabel = 'Offline';
    if (isSuspended) statusLabel = server.status === 'suspended' ? 'Suspended' : 'Connection Error';
    else if (server.isTransferring) statusLabel = 'Transferring';
    else if (server.status === 'installing') statusLabel = 'Installing';
    else if (server.status === 'restoring_backup') statusLabel = 'Restoring';
    else if (stats?.status === 'running') statusLabel = 'Online';

    const statusStyles =
        statusLabel === 'Online'
            ? {
                  backgroundColor: 'rgba(34, 197, 94, 0.18)',
                  borderColor: 'rgba(34, 197, 94, 0.45)',
                  color: 'var(--text-primary)',
              }
            : statusLabel === 'Offline'
            ? {
                  backgroundColor: 'var(--divider)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-secondary)',
              }
            : {
                  backgroundColor: 'rgba(239, 68, 68, 0.18)',
                  borderColor: 'rgba(239, 68, 68, 0.45)',
                  color: 'var(--text-primary)',
              };

    return (
        <ServerCard to={`/server/${server.id}`}>
            <div className={'flex items-start justify-between gap-3'}>
                <div className={'min-w-0'}>
                    <p className={'text-lg font-semibold break-words line-clamp-1 text-[var(--text-primary)]'}>
                        {server.name}
                    </p>
                    {!!server.description && (
                        <p className={'text-sm text-[var(--text-secondary)] break-words line-clamp-2'}>
                            {server.description}
                        </p>
                    )}
                </div>
                <span className={'text-xs px-2 py-1 rounded-full border'} style={statusStyles}>
                    {statusLabel}
                </span>
            </div>
            <div className={'grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 text-sm text-[var(--text-secondary)]'}>
                <div className={'flex items-center gap-2'}>
                    <FontAwesomeIcon icon={faEthernet} className={'text-[var(--text-muted)]'} />
                    <span className={'truncate'}>
                        IP:{' '}
                        {server.allocations
                            .filter((alloc) => alloc.isDefault)
                            .map((allocation) => (
                                <React.Fragment key={allocation.ip + allocation.port.toString()}>
                                    {allocation.alias || ip(allocation.ip)}:{allocation.port}
                                </React.Fragment>
                            ))}
                    </span>
                </div>
                <div className={'flex items-center gap-2'}>
                    <FontAwesomeIcon
                        icon={faMicrochip}
                        className={alarms.cpu ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}
                    />
                    <span>
                        CPU: {cpuUsage} / {cpuLimit}
                    </span>
                </div>
                <div className={'flex items-center gap-2'}>
                    <FontAwesomeIcon
                        icon={faMemory}
                        className={alarms.memory ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}
                    />
                    <span>
                        RAM: {memoryUsage} / {memoryLimit}
                    </span>
                </div>
                <div className={'flex items-center gap-2'}>
                    <FontAwesomeIcon
                        icon={faHdd}
                        className={alarms.disk ? 'text-[var(--error)]' : 'text-[var(--text-muted)]'}
                    />
                    <span>
                        Disk: {diskUsage} / {diskLimit}
                    </span>
                </div>
            </div>
            {!stats && !isSuspended && !server.isTransferring && !server.status && (
                <div className={'mt-3 flex items-center gap-2 text-xs text-[var(--text-muted)]'}>
                    <Spinner size={'small'} />
                    <span>Loading stats...</span>
                </div>
            )}
        </ServerCard>
    );
};
