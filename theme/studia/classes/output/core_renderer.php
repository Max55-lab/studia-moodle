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
 * Studia core renderer.
 *
 * @package    theme_studia
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace theme_studia\output;

defined('MOODLE_INTERNAL') || die();

/**
 * Renderer that adds the Studia identity to Boost.
 *
 * @package    theme_studia
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class core_renderer extends \theme_boost\output\core_renderer {

    /**
     * Adds the colour mode to the html tag.
     *
     * The mode is stored in the user preferences and rendered on the server, so
     * the browser receives the correct theme with the first response and there
     * is no flash of the wrong colours.
     *
     * @return string
     */
    public function htmlattributes() {
        $attributes = parent::htmlattributes();
        $mode = theme_studia_get_mode();

        return $attributes . ' data-theme="' . $mode . '" data-bs-theme="' . $mode . '"';
    }

    /**
     * Renders the light/dark switch.
     *
     * The switch is a plain POST form. It carries the Moodle sesskey and never
     * stores credentials in the browser.
     *
     * @return string
     */
    public function studia_theme_switch(): string {
        if (!isloggedin() || isguestuser()) {
            return '';
        }

        $mode = theme_studia_get_mode();
        $isdark = $mode === 'dark';
        $nextmode = $isdark ? 'light' : 'dark';

        $context = [
            'mode' => $mode,
            'isdark' => $isdark,
            'nextmode' => $nextmode,
            'title' => get_string($isdark ? 'switchtolight' : 'switchtodark', 'theme_studia'),
            'action' => (new \moodle_url('/theme/studia/toggle.php'))->out(false),
        ];

        return $this->render_from_template('theme_studia/theme_switch', $context);
    }

    /**
     * Renders the compact navigation drawer.
     *
     * It contains the profile summary, the current courses and the links to the
     * grade report and the calendar. All data comes from the Moodle APIs and is
     * only shown to a logged in user.
     *
     * @return string
     */
    public function studia_quick_drawer(): string {
        global $USER;

        if (!isloggedin() || isguestuser()) {
            return '';
        }

        $list = [];
        foreach (array_slice(theme_studia_get_my_courses(), 0, 6) as $course) {
            $list[] = [
                'name' => format_string(
                    $course->fullname,
                    true,
                    ['context' => \context_course::instance($course->id)]
                ),
                'url' => (new \moodle_url('/course/view.php', ['id' => $course->id]))->out(false),
            ];
        }

        $picture = new \user_picture($USER);
        $picture->size = 48;

        $context = [
            'user' => [
                'name' => fullname($USER),
                'email' => $USER->email,
                'profileurl' => (new \moodle_url('/user/profile.php', ['id' => $USER->id]))->out(false),
                'picture' => $picture->get_url($this->page)->out(false),
            ],
            'courses' => $list,
            'coursesurl' => (new \moodle_url('/my/courses.php'))->out(false),
            'gradesurl' => (new \moodle_url('/grade/report/user/index.php', ['id' => $USER->id]))->out(false),
            'calendarurl' => (new \moodle_url('/calendar/view.php'))->out(false),
        ];

        return $this->render_from_template('theme_studia/quick_drawer', $context);
    }

    /**
     * Renders the dashboard hero and the course cards.
     *
     * Nothing is rendered on other pages and nothing is rendered for guests.
     *
     * @return string
     */
    public function studia_dashboard(): string {
        global $USER;

        if ($this->page->pagelayout !== 'mydashboard' || !isloggedin() || isguestuser()) {
            return '';
        }

        $courses = theme_studia_get_my_courses();
        $limit = (int) get_config('theme_studia', 'dashboardcoursecount');
        $limit = max(3, min(12, $limit));

        $cards = [];
        $totalprogress = 0;
        $tracked = 0;

        foreach ($courses as $course) {
            if (count($cards) >= $limit) {
                break;
            }

            $progress = \core_completion\progress::get_course_progress_percentage($course);
            $hasprogress = $progress !== null;
            if ($hasprogress) {
                $totalprogress += $progress;
                $tracked++;
            }

            $teachers = $this->studia_course_teachers($course);

            $cards[] = [
                'name' => format_string(
                    $course->fullname,
                    true,
                    ['context' => \context_course::instance($course->id)]
                ),
                'shortname' => $course->shortname,
                'url' => (new \moodle_url('/course/view.php', ['id' => $course->id]))->out(false),
                'mark' => $this->studia_course_mark($course->fullname),
                'hasprogress' => $hasprogress,
                'progress' => $hasprogress ? (int) round($progress) : 0,
                'teachers' => $teachers['teachers'],
                'moreteachers' => $teachers['moreteachers'],
            ];
        }

        $average = $tracked > 0 ? (int) round($totalprogress / $tracked) : null;

        $context = [
            'greeting' => $this->studia_greeting(),
            'name' => fullname($USER),
            'semester' => $this->studia_semester_label(),
            'intro' => get_string('dashboardintro', 'theme_studia'),
            'courses' => $cards,
            'coursescount' => count($courses),
            'avgprogress' => $average,
            'hasprogress' => $average !== null,
            'courselisturl' => (new \moodle_url('/my/courses.php'))->out(false),
            'calendarurl' => (new \moodle_url('/calendar/view.php'))->out(false),
        ];

        return $this->render_from_template('theme_studia/dashboard', $context);
    }

    /**
     * Returns the greeting for the current time of day.
     *
     * @return string
     */
    protected function studia_greeting(): string {
        $hour = (int) userdate(time(), '%H');

        if ($hour < 12) {
            return get_string('goodmorning', 'theme_studia');
        }
        if ($hour < 18) {
            return get_string('goodafternoon', 'theme_studia');
        }

        return get_string('goodevening', 'theme_studia');
    }

    /**
     * Returns the label of the active semester.
     *
     * Administrators can override the automatic label in the theme settings.
     *
     * @return string
     */
    protected function studia_semester_label(): string {
        $label = get_config('theme_studia', 'semesterlabel');
        if (!empty($label)) {
            return $label;
        }

        $now = usergetdate(time());
        $year = (int) $now['year'];
        $month = (int) $now['mon'];

        if ($month >= 10 || $month <= 2) {
            $semester = get_string('wintersemester', 'theme_studia');
            $startyear = $month >= 10 ? $year : $year - 1;
        } else {
            $semester = get_string('summersemester', 'theme_studia');
            $startyear = $year - 1;
        }

        return $semester . ' ' . $startyear . '/' . ($startyear + 1);
    }

    /**
     * Returns the teachers of a course in a display friendly format.
     *
     * @param \stdClass $course Course record.
     * @return array Array with "teachers" and "moreteachers" strings.
     */
    protected function studia_course_teachers(\stdClass $course): array {
        $list = new \core_course_list_element($course);
        $contacts = $list->get_course_contacts();

        $teachers = [];
        foreach ($contacts as $contact) {
            $user = $contact['user'];
            if (!\user_can_view_profile($user, $course)) {
                continue;
            }
            $teachers[] = $contact['username'];
        }

        $visible = array_slice($teachers, 0, 2);
        $more = count($teachers) - count($visible);

        return [
            'teachers' => implode(', ', $visible),
            'moreteachers' => $more > 0 ? get_string('moreteachers', 'theme_studia', $more) : '',
        ];
    }

    /**
     * Returns the first letter of the course name.
     *
     * @param string $name Course name.
     * @return string
     */
    protected function studia_course_mark(string $name): string {
        $name = trim($name);

        return $name !== '' ? mb_strtoupper(mb_substr($name, 0, 1)) : '?';
    }
}
