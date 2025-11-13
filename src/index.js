import { addFilter } from '@wordpress/hooks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, Button, ButtonGroup } from '@wordpress/components';
import { useState, useEffect, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

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
    return (props) => {
        if (!supportedBlocks.includes(props.name)) {
            return <BlockEdit {...props} />;
        }

        const { attributes, setAttributes, clientId } = props;
        const { brSettings = {} } = attributes;
        const [brElements, setBrElements] = useState([]);

        useEffect(() => {
            // ブロック内のbrタグを取得して設定を適用
            const updateBrList = () => {
                const blockElement = document.querySelector(`[data-block="${clientId}"]`);
                if (blockElement) {
                    const brs = Array.from(blockElement.querySelectorAll('.block-editor-rich-text__editable br'));
                    setBrElements(brs);
                    
                    // 保存された設定をbrタグに適用
                    brs.forEach((br, index) => {
                        const setting = brSettings[index];
                        br.classList.remove('uk-br-show-pc-only', 'uk-br-show-tablet-only', 'uk-br-show-mobile-only');
                        if (setting) {
                            br.classList.add(setting);
                        }
                        
                        // data属性で番号を設定
                        br.setAttribute('data-br-index', index + 1);
                        
                        // 既存のマーカーを削除
                        const existingMarker = br.previousSibling;
                        if (existingMarker && existingMarker.classList && existingMarker.classList.contains('uk-br-marker')) {
                            existingMarker.remove();
                        }
                        
                        // マーカー要素を作成して挿入
                        const marker = document.createElement('span');
                        marker.className = 'uk-br-marker';
                        marker.contentEditable = 'false';
                        marker.style.cssText = 'display: inline-block; background-color: #f0f0f0; color: #666; font-size: 11px; padding: 2px 8px; border-radius: 3px; margin: 0 4px; border: 1px solid #ddd; font-weight: 500; pointer-events: none; user-select: none;';
                        
                        let markerText = `改行 ${index + 1}`;
                        
                        if (setting === 'uk-br-show-pc-only') {
                            markerText = `改行 ${index + 1} - PCのみ`;
                            marker.style.backgroundColor = '#2271b1';
                            marker.style.color = '#fff';
                            marker.style.borderColor = '#135e96';
                        } else if (setting === 'uk-br-show-tablet-only') {
                            markerText = `改行 ${index + 1} - タブレットのみ`;
                            marker.style.backgroundColor = '#d63638';
                            marker.style.color = '#fff';
                            marker.style.borderColor = '#b32d2e';
                        } else if (setting === 'uk-br-show-mobile-only') {
                            markerText = `改行 ${index + 1} - スマホのみ`;
                            marker.style.backgroundColor = '#00a32a';
                            marker.style.color = '#fff';
                            marker.style.borderColor = '#007a1f';
                        }
                        
                        marker.textContent = markerText;
                        
                        // brタグの前にマーカーを挿入
                        br.parentNode.insertBefore(marker, br);
                    });
                }
            };

            updateBrList();
            
            // MutationObserverでDOM変更を監視
            const blockElement = document.querySelector(`[data-block="${clientId}"]`);
            if (blockElement) {
                const observer = new MutationObserver(() => {
                    // タイムアウトを使用して頻繁な更新を防ぐ
                    clearTimeout(window.ukBrUpdateTimeout);
                    window.ukBrUpdateTimeout = setTimeout(updateBrList, 100);
                });
                observer.observe(blockElement, { 
                    childList: true, 
                    subtree: true,
                    characterData: true,
                });
                
                return () => {
                    observer.disconnect();
                    clearTimeout(window.ukBrUpdateTimeout);
                };
            }
        }, [clientId, brSettings]);

        const toggleBrClass = (index, className) => {
            const newSettings = { ...brSettings };
            
            // 既に同じクラスが設定されている場合は削除
            if (newSettings[index] === className) {
                delete newSettings[index];
            } else {
                // 新しいクラスを設定
                newSettings[index] = className;
            }
            
            setAttributes({ brSettings: newSettings });
        };

        const getBrClass = (index) => {
            return brSettings[index] || null;
        };

        return (
            <Fragment>
                <BlockEdit {...props} />
                <InspectorControls>
                    <PanelBody
                        title={__('改行の表示設定', 'uk-br-changer')}
                        initialOpen={true}
                    >
                        <p style={{ fontSize: '13px', color: '#757575', marginBottom: '12px' }}>
                            {__('このブロック内の改行を個別に設定できます', 'uk-br-changer')}
                        </p>
                        
                        {brElements.length === 0 && (
                            <p style={{ fontSize: '13px', color: '#999' }}>
                                {__('改行がありません。Shift+Enterで改行を追加してください。', 'uk-br-changer')}
                            </p>
                        )}
                        
                        {brElements.map((br, index) => {
                            const currentClass = getBrClass(index);
                            return (
                                <div 
                                    key={index} 
                                    style={{ 
                                        marginBottom: '16px', 
                                        padding: '12px', 
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        backgroundColor: '#f9f9f9'
                                    }}
                                >
                                    <div style={{ marginBottom: '8px', fontWeight: '500' }}>
                                        {__('改行', 'uk-br-changer')} {index + 1}
                                    </div>
                                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                                        {__('表示するデバイスを選択:', 'uk-br-changer')}
                                    </div>
                                    <ButtonGroup style={{ display: 'flex', gap: '4px' }}>
                                        <Button
                                            isSmall
                                            variant={currentClass === 'uk-br-show-pc-only' ? 'primary' : 'secondary'}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleBrClass(index, 'uk-br-show-pc-only');
                                            }}
                                        >
                                            PCのみ
                                        </Button>
                                        <Button
                                            isSmall
                                            variant={currentClass === 'uk-br-show-tablet-only' ? 'primary' : 'secondary'}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleBrClass(index, 'uk-br-show-tablet-only');
                                            }}
                                        >
                                            タブレットのみ
                                        </Button>
                                        <Button
                                            isSmall
                                            variant={currentClass === 'uk-br-show-mobile-only' ? 'primary' : 'secondary'}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                toggleBrClass(index, 'uk-br-show-mobile-only');
                                            }}
                                        >
                                            スマホのみ
                                        </Button>
                                    </ButtonGroup>
                                    {!currentClass && (
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#999' }}>
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
