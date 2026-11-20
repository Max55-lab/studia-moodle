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
 * Stores the light/dark mode preference for the current user.
 *
 * The endpoint is only available over POST with a valid Moodle sesskey. It
 * never exposes an API token and never writes to the browser storage.
 *
 * @package    theme_studia
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require(__DIR__ . '/../../config.php');
require_once($CFG->libdir . '/sessionlib.php');

require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    throw new \moodle_exception('invalidrequest', 'error');
}

require_sesskey();

$mode = optional_param('mode', '', PARAM_ALPHA);
if (!in_array($mode, ['light', 'dark'], true)) {
    throw new moodle_exception('invalidmode', 'theme_studia');
}

set_user_preference('theme_studia_mode', $mode);

$redirect = optional_param('redirect', '', PARAM_LOCALURL);
if ($redirect === '') {
    $redirect = get_local_referer(false);
}
if (empty($redirect) || strpos($redirect, $CFG->wwwroot) !== 0) {
    $redirect = $CFG->wwwroot . '/my/';
}

redirect($redirect);
