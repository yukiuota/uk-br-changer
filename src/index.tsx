import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Button, ColorIndicator } from '@wordpress/components';
import { Fragment, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import type { BlockEditProps } from '@wordpress/blocks';
import type { MouseEvent as ReactMouseEvent } from 'react';

declare const wp: any;

interface BrColorSettings {
    pc: string;
    tablet: string;
    mobile: string;
}

interface LegacyBrColors {
    pc?: string;
    tablet?: string;
    mobile?: string;
}

interface BrSettings {
    [key: string]: string | BrColorSettings | undefined;
    __colors?: BrColorSettings;
}

interface CustomAttributes {
    brSettings?: BrSettings;
    brColors?: LegacyBrColors;
    brPcColor?: string;
    brTabletColor?: string;
    brMobileColor?: string;
}

interface BrTypeConfig {
    label: string;
    color: string;
    icon: string;
}

interface BrTypes {
    [key: string]: BrTypeConfig;
}

type DeviceKey = 'pc' | 'tablet' | 'mobile';

type SupportedBlockEditProps = BlockEditProps<CustomAttributes> & {
    name: string;
};

const DEFAULT_COLORS: Record<DeviceKey, string> = {
    pc: '#2271b1',
    tablet: '#d63638',
    mobile: '#00a32a',
};

const BASE_BR_TYPES: BrTypes = {
    'uk-br-show-pc-only': {
        label: 'PCのみ',
        color: DEFAULT_COLORS.pc,
        icon: '🖥️',
    },
    'uk-br-show-tablet-only': {
        label: 'タブレットのみ',
        color: DEFAULT_COLORS.tablet,
        icon: '📱',
    },
    'uk-br-show-mobile-only': {
        label: 'スマホのみ',
        color: DEFAULT_COLORS.mobile,
        icon: '📱',
    },
};

const supportedBlocks: string[] = ['core/heading', 'core/paragraph'];

function addBreakpointAttributes(settings: any, name: string): any {
    if (!supportedBlocks.includes(name)) {
        return settings;
    }

    return {
        ...settings,
        attributes: {
            ...settings.attributes,
            brSettings: {
                type: 'object',
                default: {},
            },
            brPcColor: {
                type: 'string',
                default: DEFAULT_COLORS.pc,
            },
            brTabletColor: {
                type: 'string',
                default: DEFAULT_COLORS.tablet,
            },
            brMobileColor: {
                type: 'string',
                default: DEFAULT_COLORS.mobile,
            },
            brColors: {
                type: 'object',
                default: {},
            },
        },
    };
}

addFilter('blocks.registerBlockType', 'uk-br-changer/add-breakpoint-attributes', addBreakpointAttributes);

const withBreakControls = createHigherOrderComponent((BlockEdit) => {
    return (props: SupportedBlockEditProps) => {
        if (!supportedBlocks.includes(props.name)) {
            return <BlockEdit {...props} />;
        }

        const { attributes, setAttributes, clientId } = props;
        const {
            brSettings = {},
            brPcColor,
            brTabletColor,
            brMobileColor,
            brColors,
        } = attributes;

        const [brElements, setBrElements] = useState<HTMLBRElement[]>([]);
        const blockElementRef = useRef<HTMLElement | null>(null);
        const lastBrCountRef = useRef(0);
        const applyMarkersRef = useRef<() => void>(() => {});

        const resolvedColors: BrColorSettings = brSettings.__colors || {
            pc: brPcColor || brColors?.pc || DEFAULT_COLORS.pc,
            tablet: brTabletColor || brColors?.tablet || DEFAULT_COLORS.tablet,
            mobile: brMobileColor || brColors?.mobile || DEFAULT_COLORS.mobile,
        };

        useEffect(() => {
            if (brSettings.__colors) {
                return;
            }

            const initialColors: BrColorSettings = {
                pc: brPcColor || brColors?.pc || DEFAULT_COLORS.pc,
                tablet: brTabletColor || brColors?.tablet || DEFAULT_COLORS.tablet,
                mobile: brMobileColor || brColors?.mobile || DEFAULT_COLORS.mobile,
            };

            setAttributes({
                brSettings: {
                    ...brSettings,
                    __colors: initialColors,
                },
                brColors: {},
                brPcColor: initialColors.pc,
                brTabletColor: initialColors.tablet,
                brMobileColor: initialColors.mobile,
            });
        }, [brSettings, brColors, brPcColor, brTabletColor, brMobileColor, setAttributes]);

        const dynamicBrTypes: BrTypes = {
            'uk-br-show-pc-only': {
                ...BASE_BR_TYPES['uk-br-show-pc-only'],
                color: resolvedColors.pc,
            },
            'uk-br-show-tablet-only': {
                ...BASE_BR_TYPES['uk-br-show-tablet-only'],
                color: resolvedColors.tablet,
            },
            'uk-br-show-mobile-only': {
                ...BASE_BR_TYPES['uk-br-show-mobile-only'],
                color: resolvedColors.mobile,
            },
        };

        useEffect(() => {
            applyMarkersRef.current = () => {
                const blockElement = blockElementRef.current;
                if (!blockElement) {
                    return;
                }

                const existingMarkers = blockElement.querySelectorAll('.uk-br-marker');
                existingMarkers.forEach((marker) => marker.remove());

                let brs = Array.from(blockElement.querySelectorAll<HTMLBRElement>('br[data-rich-text-line-break="true"]'));
                if (!brs.length) {
                    brs = Array.from(blockElement.querySelectorAll<HTMLBRElement>('br'));
                }

                setBrElements(brs);
                lastBrCountRef.current = brs.length;

                brs.forEach((br, index) => {
                    const rawSetting = brSettings[index];
                    const setting = typeof rawSetting === 'string' ? rawSetting : undefined;

                    br.classList.remove('uk-br-show-pc-only', 'uk-br-show-tablet-only', 'uk-br-show-mobile-only');
                    if (setting) {
                        br.classList.add(setting);
                    }

                    br.setAttribute('data-br-index', String(index + 1));

                    let markerText = `改行 ${index + 1}`;
                    let markerClass = '';

                    if (setting === 'uk-br-show-pc-only') {
                        markerText = `改行 ${index + 1} - PCのみ`;
                        markerClass = 'uk-br-marker-pc';
                    } else if (setting === 'uk-br-show-tablet-only') {
                        markerText = `改行 ${index + 1} - タブレットのみ`;
                        markerClass = 'uk-br-marker-tablet';
                    } else if (setting === 'uk-br-show-mobile-only') {
                        markerText = `改行 ${index + 1} - スマホのみ`;
                        markerClass = 'uk-br-marker-mobile';
                    }

                    const prevNode = br.previousSibling as HTMLElement | null;
                    const isMarker = prevNode?.classList?.contains('uk-br-marker');

                    if (!isMarker) {
                        const marker = document.createElement('span');
                        marker.className = 'uk-br-marker' + (markerClass ? ` ${markerClass}` : '');
                        marker.contentEditable = 'false';
                        marker.setAttribute('data-br-index', String(index + 1));
                        marker.setAttribute('aria-label', markerText);
                        marker.setAttribute('title', markerText);
                        marker.style.width = '10px';
                        marker.style.height = '10px';
                        marker.style.display = 'inline-block';
                        marker.style.borderRadius = '50%';
                        marker.style.verticalAlign = 'middle';
                        marker.style.margin = '0 4px';

                        if (setting === 'uk-br-show-pc-only') {
                            marker.style.backgroundColor = resolvedColors.pc;
                        } else if (setting === 'uk-br-show-tablet-only') {
                            marker.style.backgroundColor = resolvedColors.tablet;
                        } else if (setting === 'uk-br-show-mobile-only') {
                            marker.style.backgroundColor = resolvedColors.mobile;
                        }

                        br.parentNode?.insertBefore(marker, br);
                    }
                });
            };

            applyMarkersRef.current();
        }, [brSettings, resolvedColors.pc, resolvedColors.tablet, resolvedColors.mobile]);

        useEffect(() => {
            let retryTimer: number | null = null;
            let observer: MutationObserver | null = null;
            let updateTimer: number | null = null;

            const findBlockElement = () => {
                const blockElement = document.querySelector<HTMLElement>(`[data-block="${clientId}"]`);
                if (!blockElement) {
                    retryTimer = window.setTimeout(findBlockElement, 150);
                    return;
                }

                blockElementRef.current = blockElement;
                applyMarkersRef.current();

                observer = new MutationObserver(() => {
                    const element = blockElementRef.current;
                    if (!element) {
                        return;
                    }

                    const richTextBrs = element.querySelectorAll('br[data-rich-text-line-break="true"]');
                    const fallbackBrs = element.querySelectorAll('br');
                    const currentBrCount = richTextBrs.length || fallbackBrs.length;

                    if (currentBrCount !== lastBrCountRef.current) {
                        if (updateTimer) {
                            window.clearTimeout(updateTimer);
                        }
                        updateTimer = window.setTimeout(() => {
                            applyMarkersRef.current();
                        }, 120);
                    }
                });

                observer.observe(blockElement, {
                    childList: true,
                    subtree: true,
                });
            };

            findBlockElement();

            return () => {
                if (retryTimer) {
                    window.clearTimeout(retryTimer);
                }
                if (updateTimer) {
                    window.clearTimeout(updateTimer);
                }
                observer?.disconnect();
            };
        }, [clientId]);

        const toggleBrClass = (index: number, className: string): void => {
            const newSettings: BrSettings = { ...brSettings };
            const currentValue = typeof newSettings[index] === 'string' ? (newSettings[index] as string) : undefined;

            if (currentValue === className) {
                delete newSettings[index];
            } else {
                newSettings[index] = className;
            }

            setAttributes({ brSettings: newSettings });
        };

        const getBrClass = (index: number): string | null => {
            const value = brSettings[index];
            return typeof value === 'string' ? value : null;
        };

        return (
            <Fragment>
                <BlockEdit {...props} />
                <InspectorControls>
                    <PanelBody title={__('改行の表示設定', 'uk-br-changer')} initialOpen={true}>
                        <p
                            style={{
                                fontSize: '13px',
                                color: '#757575',
                                marginBottom: '12px',
                            }}
                        >
                            {__('このブロック内の改行を個別に設定できます', 'uk-br-changer')}
                        </p>

                        {brElements.length === 0 && (
                            <p
                                style={{
                                    fontSize: '13px',
                                    color: '#999',
                                }}
                            >
                                {__('改行がありません。Shift+Enterで改行を追加してください。', 'uk-br-changer')}
                            </p>
                        )}

                        {brElements.map((br, index) => {
                            const currentClass = getBrClass(index);
                            const brType = currentClass ? dynamicBrTypes[currentClass] : null;

                            return (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '16px',
                                        padding: '12px',
                                        border: brType ? `2px solid ${brType.color}` : '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: brType ? `${brType.color}15` : '#f9f9f9',
                                        transition: 'all 0.2s ease',
                                    }}
                                >
                                    <div
                                        style={{
                                            marginBottom: '8px',
                                            fontWeight: '500',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                        }}
                                    >
                                        <span>
                                            {__('改行', 'uk-br-changer')} {index + 1}
                                        </span>
                                        {brType && (
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '11px',
                                                    color: brType.color,
                                                    fontWeight: 'bold',
                                                }}
                                            >
                                                <ColorIndicator colorValue={brType.color} />
                                                {brType.icon} {brType.label}
                                            </span>
                                        )}
                                    </div>
                                    <div
                                        style={{
                                            marginBottom: '8px',
                                            fontSize: '12px',
                                            color: '#666',
                                        }}
                                    >
                                        {__('表示するデバイスを選択:', 'uk-br-changer')}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '4px',
                                            flexWrap: 'wrap',
                                        }}
                                    >
                                        {Object.entries(dynamicBrTypes).map(([className, config]) => (
                                            <Button
                                                key={className}
                                                isSmall
                                                variant={currentClass === className ? 'primary' : 'secondary'}
                                                onClick={(event: ReactMouseEvent<HTMLButtonElement>) => {
                                                    event.preventDefault();
                                                    toggleBrClass(index, className);
                                                }}
                                                style={{
                                                    borderColor: currentClass === className ? config.color : undefined,
                                                    backgroundColor:
                                                        currentClass === className ? config.color : undefined,
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                    }}
                                                >
                                                    {config.icon} {config.label}
                                                </span>
                                            </Button>
                                        ))}
                                    </div>
                                    {!currentClass && (
                                        <div
                                            style={{
                                                marginTop: '8px',
                                                fontSize: '11px',
                                                color: '#999',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            <ColorIndicator colorValue="#999" />
                                            {__('すべてのデバイスで表示', 'uk-br-changer')}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </PanelBody>
                </InspectorControls>
            </Fragment>
        );
    };
}, 'withBreakControls');

addFilter('editor.BlockEdit', 'uk-br-changer/with-break-controls', withBreakControls);

addFilter(
    'blocks.getSaveContent.extraProps',
    'uk-br-changer/apply-br-classes',
    (extraProps: any, blockType: any) => {
        if (!supportedBlocks.includes(blockType.name)) {
            return extraProps;
        }

        return extraProps;
    }
);
