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
 * Studia theme settings.
 *
 * @package    theme_studia
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

if ($ADMIN->fulltree) {
    $settings = new theme_boost_admin_settingspage_tabs(
        'themesettingstudia',
        get_string('configtitle', 'theme_studia')
    );

    $page = new admin_settingpage('theme_studia_general', get_string('generalsettings', 'theme_studia'));

    $name = 'theme_studia/defaultmode';
    $title = get_string('defaultmode', 'theme_studia');
    $description = get_string('defaultmodedesc', 'theme_studia');
    $setting = new admin_setting_configselect($name, $title, $description, 'light', [
        'light' => get_string('light', 'theme_studia'),
        'dark' => get_string('dark', 'theme_studia'),
    ]);
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    $name = 'theme_studia/brandcolor';
    $title = get_string('brandcolor', 'theme_studia');
    $description = get_string('brandcolor_desc', 'theme_studia');
    $setting = new admin_setting_configcolourpicker($name, $title, $description, '#6d28d9');
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    $name = 'theme_studia/semesterlabel';
    $title = get_string('semesterlabel', 'theme_studia');
    $description = get_string('semesterlabeldesc', 'theme_studia');
    $setting = new admin_setting_configtext($name, $title, $description, '', PARAM_TEXT);
    $page->add($setting);

    $name = 'theme_studia/dashboardcoursecount';
    $title = get_string('dashboardcoursecount', 'theme_studia');
    $description = get_string('dashboardcoursecountdesc', 'theme_studia');
    $setting = new admin_setting_configtext($name, $title, $description, 6, PARAM_INT);
    $page->add($setting);

    $settings->add($page);

    $page = new admin_settingpage('theme_studia_advanced', get_string('advancedsettings', 'theme_studia'));

    $setting = new admin_setting_scsscode(
        'theme_studia/scsspre',
        get_string('rawscsspre', 'theme_studia'),
        get_string('rawscsspredesc', 'theme_studia'),
        '',
        PARAM_RAW
    );
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    $setting = new admin_setting_scsscode(
        'theme_studia/scss',
        get_string('rawscss', 'theme_studia'),
        get_string('rawscssdesc', 'theme_studia'),
        '',
        PARAM_RAW
    );
    $setting->set_updatedcallback('theme_reset_all_caches');
    $page->add($setting);

    $settings->add($page);
}
