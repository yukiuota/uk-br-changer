import {
    addFilter
} from '@wordpress/hooks';
import {
    createHigherOrderComponent
} from '@wordpress/compose';
import {
    InspectorControls,
    withColors
} from '@wordpress/block-editor';
import {
    PanelBody,
    Button,
    ColorIndicator
} from '@wordpress/components';
import {
    useState,
    useEffect,
    Fragment
} from '@wordpress/element';
import {
    __
} from '@wordpress/i18n';

// 改行タイプごとの色定義
const BR_TYPES = {
    'uk-br-show-pc-only': {
        label: 'PCのみ',
        color: '#2271b1',
        borderColor: '#135e96',
        icon: '🖥️'
    },
    'uk-br-show-tablet-only': {
        label: 'タブレットのみ',
        color: '#d63638',
        borderColor: '#b32d2e',
        icon: '📱'
    },
    'uk-br-show-mobile-only': {
        label: 'スマホのみ',
        color: '#00a32a',
        borderColor: '#007a1f',
        icon: '📱'
    }
};

/**
 * 対応するブロックのリスト
 */
const supportedBlocks = [
    'core/heading',
    'core/paragraph'
];

/**
 * ブロック属性にカスタム属性を追加
 */
function addBreakpointAttributes(settings, name) {
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
        },
    };
}

addFilter(
    'blocks.registerBlockType',
    'uk-br-changer/add-breakpoint-attributes',
    addBreakpointAttributes
);

/**
 * ブロックエディタにカスタムサイドバーを追加
 */
const withBreakControls = createHigherOrderComponent((BlockEdit) => {
return withColors({
    pcColor: 'pc-break-color'
}, {
    tabletColor: 'tablet-break-color'
}, {
    mobileColor: 'mobile-break-color'
})((props) => {
    if (!supportedBlocks.includes(props.name)) {
        return <BlockEdit {
            ...props
        }
        />;
    }

    const {
        attributes,
        setAttributes,
        clientId,
        pcColor,
        tabletColor,
        mobileColor,
        setPcColor,
        setTabletColor,
        setMobileColor
    } = props;
    const {
        brSettings = {}
    } = attributes;
    const [brElements, setBrElements] = useState([]);

    // 初期色の設定
    useEffect(() => {
        if (!pcColor.color) setPcColor('#2271b1');
        if (!tabletColor.color) setTabletColor('#d63638');
        if (!mobileColor.color) setMobileColor('#00a32a');
    }, []);

    // カスタム色を使用したBR_TYPES
    const BR_TYPES = {
        'uk-br-show-pc-only': {
            label: 'PCのみ',
            color: pcColor.color || '#2271b1',
            icon: '🖥️'
        },
        'uk-br-show-tablet-only': {
            label: 'タブレットのみ',
            color: tabletColor.color || '#d63638',
            icon: '📱'
        },
        'uk-br-show-mobile-only': {
            label: 'スマホのみ',
            color: mobileColor.color || '#00a32a',
            icon: '📱'
        }
    };

    useEffect(() => {
        let lastBrCount = 0;

        // ブロック内のbrタグを取得して設定を適用
        const updateBrList = () => {
            const blockElement = document.querySelector(`[data-block="${clientId}"]`);
            if (!blockElement) return;

            // 既存のマーカーを削除
            const existingMarkers = blockElement.querySelectorAll('.uk-br-marker');
            existingMarkers.forEach(marker => marker.remove());

            // brタグを検索（複数のセレクタで試す）
            let brs = Array.from(blockElement.querySelectorAll('br[data-rich-text-line-break="true"]'));
            if (brs.length === 0) {
                brs = Array.from(blockElement.querySelectorAll('br'));
            }

            setBrElements(brs);
            lastBrCount = brs.length;

            // 保存された設定をbrタグに適用
            brs.forEach((br, index) => {
                const setting = brSettings[index];
                br.classList.remove('uk-br-show-pc-only', 'uk-br-show-tablet-only', 'uk-br-show-mobile-only');

                if (setting) {
                    br.classList.add(setting);
                }

                br.setAttribute('data-br-index', index + 1);

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

                // 改行の直前にマーカーを挿入
                const prevNode = br.previousSibling;
                if (!prevNode || !prevNode.classList || !prevNode.classList.contains('uk-br-marker')) {
                    const marker = document.createElement('span');
                    marker.className = 'uk-br-marker' + (markerClass ? ' ' + markerClass : '');
                    marker.contentEditable = 'false';
                    marker.setAttribute('data-br-index', index + 1);
                    marker.setAttribute('aria-label', markerText);
                    marker.setAttribute('title', markerText);

                    // インラインスタイルで幅と高さを設定
                    marker.style.width = '10px';
                    marker.style.height = '10px';
                    marker.style.display = 'inline-block';
                    marker.style.borderRadius = '50%';
                    marker.style.verticalAlign = 'middle';
                    marker.style.margin = '0 4px';

                    // 色を設定
                    if (setting === 'uk-br-show-pc-only') {
                        marker.style.backgroundColor = pcColor.color || '#2271b1';
                    } else if (setting === 'uk-br-show-tablet-only') {
                        marker.style.backgroundColor = tabletColor.color || '#d63638';
                    } else if (setting === 'uk-br-show-mobile-only') {
                        marker.style.backgroundColor = mobileColor.color || '#00a32a';
                    }

                    br.parentNode.insertBefore(marker, br);
                }
            });
        };

        updateBrList();

        // MutationObserverでDOM変更を監視
        const blockElement = document.querySelector(`[data-block="${clientId}"]`);
        if (blockElement) {
            const observer = new MutationObserver((mutations) => {
                // br要素の数が変わった場合のみ更新
                let currentBrCount = blockElement.querySelectorAll('br[data-rich-text-line-break="true"]').length;
                if (currentBrCount === 0) {
                    currentBrCount = blockElement.querySelectorAll('br').length;
                }
                if (currentBrCount !== lastBrCount) {
                    clearTimeout(window.ukBrUpdateTimeout);
                    window.ukBrUpdateTimeout = setTimeout(updateBrList, 100);
                }
            });

            observer.observe(blockElement, {
                childList: true,
                subtree: true,
            });

            return () => {
                observer.disconnect();
                clearTimeout(window.ukBrUpdateTimeout);
            };
        }
    }, [clientId, brSettings, pcColor.color, tabletColor.color, mobileColor.color]);

    const toggleBrClass = (index, className) => {
        const newSettings = {
            ...brSettings
        };

        // 既に同じクラスが設定されている場合は削除
        if (newSettings[index] === className) {
            delete newSettings[index];
        } else {
            // 新しいクラスを設定
            newSettings[index] = className;
        }

        setAttributes({
            brSettings: newSettings
        });
    };

    const getBrClass = (index) => {
        return brSettings[index] || null;
    };

    return ( <
        Fragment >
        <
        BlockEdit {
            ...props
        }
        /> <
        InspectorControls >
        <
        PanelBody title = {
            __('改行の表示設定', 'uk-br-changer')
        }
        initialOpen = {
            true
        } >
        <
        p style = {
            {
                fontSize: '13px',
                color: '#757575',
                marginBottom: '12px'
            }
        } > {
            __('このブロック内の改行を個別に設定できます', 'uk-br-changer')
        } <
        /p>

        {
            brElements.length === 0 && ( <
                p style = {
                    {
                        fontSize: '13px',
                        color: '#999'
                    }
                } > {
                    __('改行がありません。Shift+Enterで改行を追加してください。', 'uk-br-changer')
                } <
                /p>
            )
        }

        {
            brElements.map((br, index) => {
                    const currentClass = getBrClass(index);
                    const brType = currentClass ? BR_TYPES[currentClass] : null;

                    return ( <
                        div key = {
                            index
                        }
                        style = {
                            {
                                marginBottom: '16px',
                                padding: '12px',
                                border: brType ? `2px solid ${brType.color}` : '1px solid #ddd',
                                borderRadius: '4px',
                                backgroundColor: brType ? `${brType.color}15` : '#f9f9f9',
                                transition: 'all 0.2s ease'
                            }
                        } >
                        <
                        div style = {
                            {
                                marginBottom: '8px',
                                fontWeight: '500',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }
                        } >
                        <
                        span > {
                            __('改行', 'uk-br-changer')
                        } {
                            index + 1
                        } < /span> {
                        brType && ( <
                            span style = {
                                {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '11px',
                                    color: brType.color,
                                    fontWeight: 'bold'
                                }
                            } >
                            <
                            ColorIndicator colorValue = {
                                brType.color
                            }
                            /> {
                            brType.icon
                        } {
                            brType.label
                        } <
                        /span>
                    )
                } <
                /div> <
                div style = {
                    {
                        marginBottom: '8px',
                        fontSize: '12px',
                        color: '#666'
                    }
                } > {
                    __('表示するデバイスを選択:', 'uk-br-changer')
                } <
                /div> <
                div style = {
                    {
                        display: 'flex',
                        gap: '4px',
                        flexWrap: 'wrap'
                    }
                } > {
                    Object.entries(BR_TYPES).map(([className, config]) => ( <
                        Button key = {
                            className
                        }
                        isSmall variant = {
                            currentClass === className ? 'primary' : 'secondary'
                        }
                        onClick = {
                            (e) => {
                                e.preventDefault();
                                toggleBrClass(index, className);
                            }
                        }
                        style = {
                            {
                                borderColor: currentClass === className ? config.color : undefined,
                                backgroundColor: currentClass === className ? config.color : undefined,
                            }
                        } >
                        <
                        span style = {
                            {
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }
                        } > {
                            config.icon
                        } {
                            config.label
                        } <
                        /span> < /
                        Button >
                    ))
                } <
                /div> {!currentClass && ( <
                div style = {
                    {
                        marginTop: '8px',
                        fontSize: '11px',
                        color: '#999',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }
                } >
                <
                ColorIndicator colorValue = "#999" / > {
                    __('すべてのデバイスで表示', 'uk-br-changer')
                } <
                /div>
            )
        } <
        /div>
    );
})
} <
/PanelBody> < /
InspectorControls > <
/Fragment>
);
});
}, 'withBreakControls');

addFilter(
    'editor.BlockEdit',
    'uk-br-changer/with-break-controls',
    withBreakControls
);

/**
 * ブロックの保存時にbrタグにクラスを追加
 */
addFilter(
    'blocks.getSaveContent.extraProps',
    'uk-br-changer/apply-br-classes',
    (extraProps, blockType, attributes) => {
        if (!supportedBlocks.includes(blockType.name)) {
            return extraProps;
        }

        // 保存時の処理は render_block フックで行う
        return extraProps;
    }
);