<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Studia theme callbacks.
 *
 * @package    theme_studia
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Returns the main SCSS content for the theme.
 *
 * @param theme_config $theme The theme config object.
 * @return string
 */
function theme_studia_get_main_scss_content($theme) {
    global $CFG;

    $scss = file_get_contents($CFG->dirroot . '/theme/studia/scss/pre.scss');
    $scss .= file_get_contents($CFG->dirroot . '/theme/boost/scss/preset/default.scss');
    $scss .= file_get_contents($CFG->dirroot . '/theme/studia/scss/post.scss');

    return $scss;
}

/**
 * Returns custom SCSS to prepend to the theme.
 *
 * @param theme_config $theme The theme config object.
 * @return string
 */
function theme_studia_get_pre_scss($theme) {
    $scss = '';

    $brandcolor = isset($theme->settings->brandcolor) ? trim($theme->settings->brandcolor) : '';
    if ($brandcolor !== '' && preg_match('/^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/', $brandcolor)) {
        $scss .= '$primary: ' . $brandcolor . ";\n";
        $scss .= '$studia-primary: ' . $brandcolor . ";\n";
    }

    if (!empty($theme->settings->scsspre)) {
        $scss .= $theme->settings->scsspre;
    }

    return $scss;
}

/**
 * Returns custom SCSS to append to the theme.
 *
 * @param theme_config $theme The theme config object.
 * @return string
 */
function theme_studia_get_extra_scss($theme) {
    return !empty($theme->settings->scss) ? $theme->settings->scss : '';
}

/**
 * Returns the user's preferred colour mode.
 *
 * The preference is read on the server so the correct theme is included in the
 * first HTML response and the page never flashes the wrong colours.
 *
 * @param int|null $userid User id, or null for the current user.
 * @return string Either "light" or "dark".
 */
function theme_studia_get_mode(?int $userid = null): string {
    global $USER;

    if ($userid === null) {
        $userid = !empty($USER->id) ? (int) $USER->id : 0;
    }

    $mode = $userid ? get_user_preferences('theme_studia_mode', '', $userid) : '';
    if (!in_array($mode, ['light', 'dark'], true)) {
        $default = get_config('theme_studia', 'defaultmode');
        $mode = in_array($default, ['light', 'dark'], true) ? $default : 'light';
    }

    return $mode;
}

/**
 * Returns the courses the current user is enrolled in.
 *
 * The result is cached for the duration of the request so the dashboard and the
 * quick drawer do not query the database twice.
 *
 * @return array Array of course records.
 */
function theme_studia_get_my_courses(): array {
    static $courses = null;

    if ($courses !== null) {
        return $courses;
    }

    $courses = [];
    if (isloggedin() && !isguestuser()) {
        global $CFG;
        require_once($CFG->libdir . '/enrollib.php');
        $courses = enrol_get_my_courses(
            ['id', 'fullname', 'shortname', 'visible', 'startdate', 'enddate', 'enablecompletion'],
            'fullname ASC',
            0
        );
        if (empty($courses)) {
            $courses = [];
        }
    }

    return $courses;
}

/**
 * Returns the user preferences managed by the theme.
 *
 * @return array[]
 */
function theme_studia_user_preferences(): array {
    return [
        'theme_studia_mode' => [
            'type' => PARAM_ALPHA,
            'null' => NULL_NOT_ALLOWED,
            'default' => '',
            'permissioncallback' => [\core_user::class, 'is_current_user'],
        ],
    ];
}
