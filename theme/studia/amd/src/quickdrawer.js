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
 * Studia quick drawer.
 *
 * @module     theme_studia/quickdrawer
 * @copyright  2026 SUM e-Učenje
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define([], function() {
    'use strict';

    /**
     * Initialise the drawer.
     */
    var init = function() {
        var drawer = document.querySelector('[data-region="studia-quick-drawer"]');
        var backdrop = document.querySelector('.studia-quick-backdrop');
        var trigger = document.querySelector('[data-action="studia-open-quick-drawer"]');

        if (!drawer || !trigger) {
            return;
        }

        var closeElements = document.querySelectorAll('[data-action="studia-close-quick-drawer"]');

        var open = function() {
            drawer.classList.add('is-open');
            document.body.classList.add('studia-quick-open');
            drawer.setAttribute('aria-hidden', 'false');
            if (backdrop) {
                backdrop.focus();
            }
        };

        var close = function() {
            drawer.classList.remove('is-open');
            document.body.classList.remove('studia-quick-open');
            drawer.setAttribute('aria-hidden', 'true');
            trigger.focus();
        };

        trigger.addEventListener('click', function(event) {
            event.preventDefault();
            open();
        });

        Array.prototype.forEach.call(closeElements, function(element) {
            element.addEventListener('click', function(event) {
                event.preventDefault();
                close();
            });
        });

        document.addEventListener('keyup', function(event) {
            if (event.key === 'Escape' && drawer.classList.contains('is-open')) {
                close();
            }
        });
    };

    return {
        init: init
    };
});
