<?php
/**
 * Plugin Name: UK br Changer
 * Plugin URI: https://github.com/yukiuota/uk-br-changer
 * Description: 見出しと段落ブロックにデバイス別の改行制御機能を追加します
 * Version: 1.0.0
 * Author: Yuki Uota
 * Author URI: https://github.com/yukiuota
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: uk-br-changer
 */

// 直接アクセスを防ぐ
if (!defined('ABSPATH')) {
    exit;
}

// プラグインのパス定義
define('UK_BR_CHANGER_VERSION', '1.0.0');
define('UK_BR_CHANGER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('UK_BR_CHANGER_PLUGIN_URL', plugin_dir_url(__FILE__));

// デフォルトのブレイクポイント
if (!get_option('uk_br_changer_breakpoints')) {
    add_option('uk_br_changer_breakpoints', array(
        'pc_min' => 1025,
        'tablet_min' => 768,
        'tablet_max' => 1024,
        'mobile_max' => 767
    ));
}

/**
 * 管理メニューを追加
 */
function uk_br_changer_add_admin_menu() {
    add_options_page(
        'UK br Changer 設定',
        'UK br Changer',
        'manage_options',
        'uk-br-changer',
        'uk_br_changer_settings_page'
    );
}
add_action('admin_menu', 'uk_br_changer_add_admin_menu');

/**
 * 設定を登録
 */
function uk_br_changer_register_settings() {
    register_setting('uk_br_changer_options', 'uk_br_changer_breakpoints', array(
        'type' => 'array',
        'sanitize_callback' => 'uk_br_changer_sanitize_breakpoints',
        'default' => array(
            'pc_min' => 1025,
            'tablet_min' => 768,
            'tablet_max' => 1024,
            'mobile_max' => 767
        )
    ));
}
add_action('admin_init', 'uk_br_changer_register_settings');

/**
 * ブレイクポイントのサニタイズ
 */
function uk_br_changer_sanitize_breakpoints($input) {
    $sanitized = array();
    
    $sanitized['pc_min'] = absint($input['pc_min']);
    $sanitized['tablet_min'] = absint($input['tablet_min']);
    $sanitized['tablet_max'] = absint($input['tablet_max']);
    $sanitized['mobile_max'] = absint($input['mobile_max']);
    
    // バリデーション
    if ($sanitized['tablet_min'] >= $sanitized['pc_min']) {
        add_settings_error(
            'uk_br_changer_breakpoints',
            'invalid_breakpoints',
            'タブレットの最小値はPCの最小値より小さくする必要があります。',
            'error'
        );
        return get_option('uk_br_changer_breakpoints');
    }
    
    if ($sanitized['tablet_max'] >= $sanitized['pc_min']) {
        add_settings_error(
            'uk_br_changer_breakpoints',
            'invalid_breakpoints',
            'タブレットの最大値はPCの最小値より小さくする必要があります。',
            'error'
        );
        return get_option('uk_br_changer_breakpoints');
    }
    
    if ($sanitized['mobile_max'] >= $sanitized['tablet_min']) {
        add_settings_error(
            'uk_br_changer_breakpoints',
            'invalid_breakpoints',
            'モバイルの最大値はタブレットの最小値より小さくする必要があります。',
            'error'
        );
        return get_option('uk_br_changer_breakpoints');
    }
    
    return $sanitized;
}

/**
 * 設定ページを表示
 */
function uk_br_changer_settings_page() {
    if (!current_user_can('manage_options')) {
        return;
    }
    
    $breakpoints = get_option('uk_br_changer_breakpoints');
    ?>
<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <?php settings_errors('uk_br_changer_breakpoints'); ?>

    <form method="post" action="options.php">
        <?php
            settings_fields('uk_br_changer_options');
            ?>

        <table class="form-table" role="presentation">
            <tbody>
                <tr>
                    <th scope="row">
                        <h2>ブレイクポイント設定</h2>
                    </th>
                    <td>
                        <p class="description">
                            各デバイスの表示範囲を設定します。CSSに反映されます。
                        </p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="pc_min">PC（最小幅）</label>
                    </th>
                    <td>
                        <input type="number" id="pc_min" name="uk_br_changer_breakpoints[pc_min]" value="<?php echo esc_attr($breakpoints['pc_min']); ?>" min="1" class="regular-text" />
                        <span>px以上</span>
                        <p class="description">デスクトップ表示の最小幅</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="tablet_min">タブレット（最小幅）</label>
                    </th>
                    <td>
                        <input type="number" id="tablet_min" name="uk_br_changer_breakpoints[tablet_min]" value="<?php echo esc_attr($breakpoints['tablet_min']); ?>" min="1" class="regular-text" />
                        <span>px以上</span>
                        <p class="description">タブレット表示の最小幅</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="tablet_max">タブレット（最大幅）</label>
                    </th>
                    <td>
                        <input type="number" id="tablet_max" name="uk_br_changer_breakpoints[tablet_max]" value="<?php echo esc_attr($breakpoints['tablet_max']); ?>" min="1" class="regular-text" />
                        <span>px以下</span>
                        <p class="description">タブレット表示の最大幅</p>
                    </td>
                </tr>

                <tr>
                    <th scope="row">
                        <label for="mobile_max">モバイル（最大幅）</label>
                    </th>
                    <td>
                        <input type="number" id="mobile_max" name="uk_br_changer_breakpoints[mobile_max]" value="<?php echo esc_attr($breakpoints['mobile_max']); ?>" min="1" class="regular-text" />
                        <span>px以下</span>
                        <p class="description">モバイル表示の最大幅</p>
                    </td>
                </tr>
            </tbody>
        </table>

        <h3>現在の設定プレビュー</h3>
        <div style="background: #f9f9f9; border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <ul style="margin: 0; padding-left: 20px;">
                <li><strong>PC:</strong> <?php echo esc_html($breakpoints['pc_min']); ?>px 以上</li>
                <li><strong>タブレット:</strong> <?php echo esc_html($breakpoints['tablet_min']); ?>px ～ <?php echo esc_html($breakpoints['tablet_max']); ?>px</li>
                <li><strong>モバイル:</strong> <?php echo esc_html($breakpoints['mobile_max']); ?>px 以下</li>
            </ul>
        </div>

        <?php submit_button('設定を保存'); ?>
    </form>
</div>
<?php
}

/**
 * ブロックエディタのアセットを読み込む
 */
function uk_br_changer_enqueue_block_editor_assets() {
    wp_enqueue_script(
        'uk-br-changer-editor',
        UK_BR_CHANGER_PLUGIN_URL . 'build/index.js',
        array('wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-compose', 'wp-hooks'),
        UK_BR_CHANGER_VERSION,
        true
    );

    // 動的CSSを生成
    $breakpoints = get_option('uk_br_changer_breakpoints');
    $custom_css = "
/* エディタ内でも同様の表示を実現（プレビューモードで確認可能） */
@media screen and (min-width: {$breakpoints['pc_min']}px) {
    br.uk-br-show-pc-only {
        display: none;
    }
}

@media screen and (min-width: {$breakpoints['tablet_min']}px) and (max-width: {$breakpoints['tablet_max']}px) {
    br.uk-br-show-tablet-only {
        display: none;
    }
}

@media screen and (max-width: {$breakpoints['mobile_max']}px) {
    br.uk-br-show-mobile-only {
        display: none;
    }
}

/* JavaScriptで挿入されるマーカーのスタイル */
.uk-br-marker {
    display: inline-block !important;
    vertical-align: middle;
    margin: 0 4px;
    transition: all 0.2s ease;
}

.uk-br-marker:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
";
    
    wp_register_style('uk-br-changer-editor-style', false);
    wp_enqueue_style('uk-br-changer-editor-style');
    wp_add_inline_style('uk-br-changer-editor-style', $custom_css);
}
add_action('enqueue_block_editor_assets', 'uk_br_changer_enqueue_block_editor_assets');

/**
 * フロントエンドのスタイルを読み込む
 */
function uk_br_changer_enqueue_frontend_assets() {
    // 動的CSSを生成
    $breakpoints = get_option('uk_br_changer_breakpoints');
    $custom_css = "
/* PCのみ表示(タブレット・モバイルで非表示) */
.uk-br-show-pc-only {
    display: inline;
}

@media screen and (max-width: {$breakpoints['tablet_max']}px) {
    br.uk-br-show-pc-only {
        display: none;
    }
}

/* タブレットのみ表示(PC・モバイルで非表示) */
br.uk-br-show-tablet-only {
    display: none;
}

@media screen and (min-width: {$breakpoints['tablet_min']}px) and (max-width: {$breakpoints['tablet_max']}px) {
    br.uk-br-show-tablet-only {
        display: inline;
    }
}

/* モバイルのみ表示(PC・タブレットで非表示) */
br.uk-br-show-mobile-only {
    display: none;
}

@media screen and (max-width: {$breakpoints['mobile_max']}px) {
    br.uk-br-show-mobile-only {
        display: inline;
    }
}
";
    
    wp_register_style('uk-br-changer-frontend', false);
    wp_enqueue_style('uk-br-changer-frontend');
    wp_add_inline_style('uk-br-changer-frontend', $custom_css);
}
add_action('wp_enqueue_scripts', 'uk_br_changer_enqueue_frontend_assets');
add_action('enqueue_block_assets', 'uk_br_changer_enqueue_frontend_assets');

/**
 * ブロックのレンダリング時にbrタグにクラスを適用し、マーカーを削除
 */
function uk_br_changer_render_block($block_content, $block) {
    // 対応するブロックのみ処理
    if (!in_array($block['blockName'], array('core/heading', 'core/paragraph'))) {
        return $block_content;
    }

    // brSettings属性がない場合でもマーカーを削除
    $has_settings = !empty($block['attrs']['brSettings']);
    $br_settings = $has_settings ? $block['attrs']['brSettings'] : array();
    
    // DOMDocumentを使用してHTMLを解析
    $dom = new DOMDocument();
    libxml_use_internal_errors(true);
    $dom->loadHTML('<?xml encoding="UTF-8">' . $block_content, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
    libxml_clear_errors();
    
    // マーカー要素を削除
    $xpath = new DOMXPath($dom);
    $markers = $xpath->query("//*[contains(@class, 'uk-br-marker')]");
    
    foreach ($markers as $marker) {
        $marker->parentNode->removeChild($marker);
    }
    
    // brSettings属性がある場合のみbrタグにクラスを適用
    if ($has_settings) {
        // すべてのbrタグを取得
        $br_tags = $dom->getElementsByTagName('br');
        $br_array = array();
        
        // DOMNodeListは動的なので配列に変換
        foreach ($br_tags as $br) {
            $br_array[] = $br;
        }
        
        // 各brタグにクラスを適用
        foreach ($br_array as $index => $br) {
            if (isset($br_settings[$index])) {
                $class = $br_settings[$index];
                $existing_class = $br->getAttribute('class');
                $new_class = $existing_class ? $existing_class . ' ' . $class : $class;
                $br->setAttribute('class', $new_class);
            }
        }
    }
    
    // UTF-8エンコーディングを保持して出力
    $html = $dom->saveHTML();
    // XML宣言を削除
    $html = str_replace('<?xml encoding="UTF-8">', '', $html);
    
    return $html;
}
add_filter('render_block', 'uk_br_changer_render_block', 10, 2);