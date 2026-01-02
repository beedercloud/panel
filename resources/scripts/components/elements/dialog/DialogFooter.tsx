import React, { useContext } from 'react';
import { DialogContext } from './';
import { useDeepCompareEffect } from '@/plugins/useDeepCompareEffect';

export default ({ children }: { children: React.ReactNode }) => {
    const { setFooter } = useContext(DialogContext);

    useDeepCompareEffect(() => {
        setFooter(
            <div
                className={'px-6 py-3 flex items-center justify-end space-x-3'}
                style={{
                    background: 'var(--panel-strong)',
                    borderTop: '1px solid var(--divider)',
                    borderBottomLeftRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: 'var(--radius-lg)',
                }}
            >
                {children}
            </div>
        );
    }, [children]);

    return null;
};
