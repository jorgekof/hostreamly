<?php
/**
 * WordPress Function Stubs for Intelephense
 * This file provides type hints and function definitions for WordPress functions
 * to resolve Intelephense warnings in the Hostreamly Elementor plugin.
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// WordPress Constants
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

if (!defined('ELEMENTOR_VERSION')) {
    define('ELEMENTOR_VERSION', '3.18.0');
}

// WordPress Core Functions
if (!function_exists('plugin_dir_path')) {
    /**
     * Get the filesystem directory path (with trailing slash) for the plugin __FILE__ passed in.
     *
     * @param string $file The filename of the plugin (__FILE__).
     * @return string The filesystem path of the directory that contains the plugin.
     */
    function plugin_dir_path($file) {
        return trailingslashit(dirname($file));
    }
}

if (!function_exists('plugin_dir_url')) {
    /**
     * Get the URL directory path (with trailing slash) for the plugin __FILE__ passed in.
     *
     * @param string $file The filename of the plugin (__FILE__).
     * @return string The URL path of the directory that contains the plugin.
     */
    function plugin_dir_url($file) {
        return trailingslashit(plugins_url('', $file));
    }
}

if (!function_exists('add_action')) {
    /**
     * Hooks a function or method to a specific filter action.
     *
     * @param string   $hook_name     The name of the action to which the $function_to_add is hooked.
     * @param callable $function_to_add The name of the function you wish to be called.
     * @param int      $priority      Optional. Used to specify the order in which the functions
     *                                associated with a particular action are executed. Default 10.
     * @param int      $accepted_args Optional. The number of arguments the function accepts. Default 1.
     * @return true Always returns true.
     */
    function add_action($hook_name, $function_to_add, $priority = 10, $accepted_args = 1) {
        return true;
    }
}

if (!function_exists('did_action')) {
    /**
     * Retrieves the number of times an action has been fired during the current request.
     *
     * @param string $hook_name The name of the action hook.
     * @return int The number of times the action hook has been fired.
     */
    function did_action($hook_name) {
        return 0;
    }
}

if (!function_exists('version_compare')) {
    /**
     * Compares two "PHP-standardized" version number strings.
     *
     * @param string $version1 First version number.
     * @param string $version2 Second version number.
     * @param string $operator Optional. The comparison operator.
     * @return mixed Returns -1, 0, or 1 when $version1 is respectively less than, equal to, or greater than $version2.
     */
    function version_compare($version1, $version2, $operator = null) {
        return \version_compare($version1, $version2, $operator);
    }
}

if (!function_exists('load_plugin_textdomain')) {
    /**
     * Loads a plugin's translated strings.
     *
     * @param string $domain          Unique identifier for retrieving translated strings.
     * @param string $deprecated      Optional. Deprecated. Use the $plugin_rel_path parameter instead.
     * @param string $plugin_rel_path Optional. Relative path to WP_PLUGIN_DIR where the .mo file resides.
     * @return bool True when textdomain is successfully loaded, false otherwise.
     */
    function load_plugin_textdomain($domain, $deprecated = false, $plugin_rel_path = false) {
        return true;
    }
}

if (!function_exists('plugin_basename')) {
    /**
     * Gets the basename of a plugin.
     *
     * @param string $file The filename of plugin.
     * @return string The name of a plugin.
     */
    function plugin_basename($file) {
        return basename(dirname($file)) . '/' . basename($file);
    }
}

if (!function_exists('plugins_url')) {
    /**
     * Retrieves a URL within the plugins or mu-plugins directory.
     *
     * @param string $path   Optional. Extra path appended to the end of the URL, including
     *                       the relative directory if $plugin is supplied. Default empty.
     * @param string $plugin Optional. Path to the plugin file relative to the plugins directory.
     *                       Default empty.
     * @return string Plugins URL link with optional paths appended.
     */
    function plugins_url($path = '', $plugin = '') {
        return 'https://example.com/wp-content/plugins/' . $path;
    }
}

if (!function_exists('trailingslashit')) {
    /**
     * Appends a trailing slash.
     *
     * @param string $string What to add the trailing slash to.
     * @return string String with trailing slash added.
     */
    function trailingslashit($string) {
        return rtrim($string, '/\\') . '/';
    }
}

// WordPress Global Constants
if (!defined('PHP_VERSION')) {
    define('PHP_VERSION', phpversion());
}

// Elementor Classes and Interfaces (Basic stubs)
if (!class_exists('\Elementor\Widget_Base')) {
    namespace Elementor {
        abstract class Widget_Base {
            abstract public function get_name();
            abstract public function get_title();
            abstract public function get_icon();
            abstract public function get_categories();
            abstract protected function register_controls();
            abstract protected function render();
        }
        
        abstract class Controls_Manager {
            const TEXT = 'text';
            const TEXTAREA = 'textarea';
            const SELECT = 'select';
            const SWITCHER = 'switcher';
            const SLIDER = 'slider';
            const COLOR = 'color';
            const MEDIA = 'media';
            const URL = 'url';
            const REPEATER = 'repeater';
        }
        
        class Repeater {
            public function add_control($id, $args = []) {}
            public function get_controls() { return []; }
        }
    }
}