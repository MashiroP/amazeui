'use strict';

var $ = require('jquery');
var UI = require('./core');
var $doc = $(document);

/**
 * bootstrap-datepicker.js
 * @via http://www.eyecon.ro/bootstrap-datepicker
 * @license http://www.apache.org/licenses/LICENSE-2.0
 */

// Picker object

var Datepicker = function(element, options) {
  this.element = $(element);
  this.format = DPGlobal.parseFormat(options.format);
  this.element.data('am-date', options.date);
  this.language = this.browserLanguage();
  this.theme = options.theme;
  this.picker = $(DPGlobal.template)
                  .appendTo('body')
                  .on({
                    click: $.proxy(this.click, this)
                    // mousedown: $.proxy(this.mousedown, this)
                  });

  this.isInput = this.element.is('input');
  this.component = this.element.is('.am-datepicker-date') ?
                     this.element.find('.am-datepicker-add-on') : false;
  if (this.isInput) {
    this.element.on({
      focus: $.proxy(this.show, this),
      // blur: $.proxy(this.hide, this),
      keyup: $.proxy(this.update, this)
    });
  } else {
    if (this.component) {
      this.component.on('click', $.proxy(this.show, this));
    } else {
      this.element.on('click', $.proxy(this.show, this));
    }
  }

  this.minViewMode = options.minViewMode;

  if (typeof this.minViewMode === 'string') {
    switch (this.minViewMode) {
      case 'months':
        this.minViewMode = 1;
        break;
      case 'years':
        this.minViewMode = 2;
        break;
      default:
        this.minViewMode = 0;
        break;
    }
  }

  this.viewMode = options.viewMode;

  if (typeof this.viewMode === 'string') {
    switch (this.viewMode) {
      case 'months':
        this.viewMode = 1;
        break;
      case 'years':
        this.viewMode = 2;
        break;
      default:
        this.viewMode = 0;
        break;
    }
  }

  this.startViewMode = this.viewMode;
  this.weekStart = options.weekStart;
  this.weekEnd = this.weekStart === 0 ? 6 : this.weekStart - 1;
  this.onRender = options.onRender;

  this.addTheme();
  this.fillDow();
  this.fillMonths();
  this.update();
  this.showMode();
};

Datepicker.prototype = {
  constructor: Datepicker,

  show: function(e) {
    this.picker.show();
    this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
    this.place();
    $(window).on('resize', $.proxy(this.place, this));
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    /*if (!this.isInput) {
     }*/
    var that = this;
    $(document).on('mousedown', function(ev) {
      if ($(ev.target).closest('.am-datepicker').length == 0) {
        that.hide();
      }
    });
    this.element.trigger({
      type: 'show',
      date: this.date
    });
  },

  hide: function() {
    this.picker.hide();
    $(window).off('resize', this.place);
    this.viewMode = this.startViewMode;
    this.showMode();
    if (!this.isInput) {
      $(document).off('mousedown', this.hide);
    }
    // this.set();
    this.element.trigger({
      type: 'hide',
      date: this.date
    });
  },

  set: function() {
    var formated = DPGlobal.formatDate(this.date, this.format);
    if (!this.isInput) {
      if (this.component) {
        this.element.find('input').prop('value', formated);
      }
      this.element.data('am-date', formated);
    } else {
      this.element.prop('value', formated);
    }
  },

  setValue: function(newDate) {
    if (typeof newDate === 'string') {
      this.date = DPGlobal.parseDate(newDate, this.format);
    } else {
      this.date = new Date(newDate);
    }
    this.set();

    this.viewDate = new Date(this.date.getFullYear(),
                  this.date.getMonth(), 1, 0, 0, 0, 0);

    this.fill();
  },

  place: function() {
    var offset = this.component ?
                 this.component.offset() : this.element.offset();
    var $width = this.component ?
        this.component.width() : this.element.width();
    var top = offset.top + this.height;
    var left = offset.left;
    var right = $doc.width() - offset.left - $width;
    var isOutView = this.isOutView();
    this.picker.removeClass('am-datepicker-right');
    this.picker.removeClass('am-datepicker-up');
    if ($doc.width() > 640) {
      if (isOutView.outRight) {
        this.picker.addClass('am-datepicker-right');
        this.picker.css({
          top: top,
          left: 'auto',
          right: right
        });
        return
      }
      if (isOutView.outBottom) {
        this.picker.addClass('am-datepicker-up');
        top = offset.top - this.picker.outerHeight(true);
      }
    } else {
      left = 0;
    }
    this.picker.css({
      top: top,
      left: left
    });
  },

  update: function(newDate) {
    this.date = DPGlobal.parseDate(
            typeof newDate === 'string' ? newDate : (this.isInput ?
                this.element.prop('value') : this.element.data('am-date')),
        this.format
    );
    this.viewDate = new Date(this.date.getFullYear(),
        this.date.getMonth(), 1, 0, 0, 0, 0);
    this.fill();
  },

  fillDow: function() {
    var dowCnt = this.weekStart;
    var html = '<tr>';
    while (dowCnt < this.weekStart + 7) {
      html += '<th class="am-datepicker-dow">' + Datepicker.locales[this.language].daysMin[(dowCnt++) % 7] + '</th>';
    }
    html += '</tr>';
    this.picker.find('.am-datepicker-days thead').append(html);
  },

  fillMonths: function() {
    var html = '';
    var i = 0;
    while (i < 12) {
      html += '<span class="am-datepicker-month">' + Datepicker.locales[this.language].monthsShort[i++] + '</span>';
    }
    this.picker.find('.am-datepicker-months td').append(html);
  },

  fill: function() {
    var d = new Date(this.viewDate);
    var year = d.getFullYear();
    var month = d.getMonth();
    var currentDate = this.date.valueOf();

    var prevMonth = new Date(year, month - 1, 28, 0, 0, 0, 0);
    var day = DPGlobal.getDaysInMonth(prevMonth.getFullYear(), prevMonth.getMonth());
    var daysSelect = this.picker.find('.am-datepicker-days .am-datepicker-select');

    if (this.language === 'zh_CN') {
      daysSelect.text(year + Datepicker.locales[this.language].year[0] + ' ' + Datepicker.locales[this.language].months[month]);
    } else {
      daysSelect.text(Datepicker.locales[this.language].months[month] + ' ' + year);
    }

    prevMonth.setDate(day);
    prevMonth.setDate(day - (prevMonth.getDay() - this.weekStart + 7) % 7);

    var nextMonth = new Date(prevMonth);
    nextMonth.setDate(nextMonth.getDate() + 42);
    nextMonth = nextMonth.valueOf();
    var html = [];

    var clsName,
        prevY,
        prevM;

    while (prevMonth.valueOf() < nextMonth) {
      if (prevMonth.getDay() === this.weekStart) {
        html.push('<tr>');
      }
      clsName = this.onRender(prevMonth);
      prevY = prevMonth.getFullYear();
      prevM = prevMonth.getMonth();
      if ((prevM < month &&  prevY === year) ||  prevY < year) {
        clsName += ' am-datepicker-old';
      } else if ((prevM > month && prevY === year) || prevY > year) {
        clsName += ' am-datepicker-new';
      }
      if (prevMonth.valueOf() === currentDate) {
        clsName += ' am-active';
      }
      html.push('<td class="am-datepicker-day ' + clsName + '">' + prevMonth.getDate() + '</td>');
      if (prevMonth.getDay() === this.weekEnd) {
        html.push('</tr>');
      }
      prevMonth.setDate(prevMonth.getDate() + 1);

    }

    this.picker.find('.am-datepicker-days tbody').empty().append(html.join(''));
    var currentYear = this.date.getFullYear();

    var months = this.picker.find('.am-datepicker-months')
        .find('.am-datepicker-select')
        .text(year);
    months = months.end()
              .find('span').removeClass('am-active');

    if (currentYear === year) {
      months.eq(this.date.getMonth()).addClass('am-active');
    }

    html = '';
    year = parseInt(year / 10, 10) * 10;
    var yearCont = this.picker
        .find('.am-datepicker-years')
        .find('.am-datepicker-select')
        .text(year + '-' + (year + 9))
        .end()
        .find('td');

    year -= 1;
    for (var i = -1; i < 11; i++) {
      html += '<span class="' + (i === -1 || i === 10 ? ' am-datepicker-old' : '') + (currentYear === year ? ' am-active' : '') + '">' + year + '</span>';
      year += 1;
    }
    yearCont.html(html);

  },

  click: function(event) {
    event.stopPropagation();
    event.preventDefault();

    var target = $(event.target).closest('span, td, th');
    if (target.length === 1) {
      switch (target[0].nodeName.toLowerCase()) {
        case 'th':
          switch (target[0].className) {
            case 'am-datepicker-switch':
              this.showMode(1);
              break;
            case 'am-datepicker-prev':
            case 'am-datepicker-next':
              this.viewDate['set' + DPGlobal.modes[this.viewMode].navFnc].call(
                  this.viewDate,
                      this.viewDate['get' + DPGlobal.modes[this.viewMode].navFnc].call(this.viewDate) +
                      DPGlobal.modes[this.viewMode].navStep * (target[0].className === 'am-datepicker-prev' ? -1 : 1)
              );
              this.fill();
              this.set();
              break;
          }
          break;
        case 'span':
          if (target.is('.am-datepicker-month')) {
            var month = target.parent().find('span').index(target);
            this.viewDate.setMonth(month);
          } else {
            var year = parseInt(target.text(), 10) || 0;
            this.viewDate.setFullYear(year);
          }
          if (this.viewMode !== 0) {
            this.date = new Date(this.viewDate);
            this.element.trigger({
              type: 'changeDate.datepicker.amui',
              date: this.date,
              viewMode: DPGlobal.modes[this.viewMode].clsName
            });
          }
          this.showMode(-1);
          this.fill();
          this.set();
          break;
        case 'td':
          if (target.is('.am-datepicker-day') && !target.is('.am-disabled')) {
            var day = parseInt(target.text(), 10) || 1;
            var month = this.viewDate.getMonth();
            if (target.is('.am-datepicker-old')) {
              month -= 1;
            } else if (target.is('.am-datepicker-new')) {
              month += 1;
            }
            var year = this.viewDate.getFullYear();
            this.date = new Date(year, month, day, 0, 0, 0, 0);
            this.viewDate = new Date(year, month, Math.min(28, day), 0,0,0,0);
            this.fill();
            this.set();
            this.element.trigger({
              type: 'changeDate.datepicker.amui',
              date: this.date,
              viewMode: DPGlobal.modes[this.viewMode].clsName
            });
          }
          break;
      }
    }
  },

  mousedown: function(event) {
    event.stopPropagation();
    event.preventDefault();
  },

  showMode: function(dir) {
    if (dir) {
      this.viewMode = Math.max(this.minViewMode,
          Math.min(2, this.viewMode + dir));
    }

    this.picker
        .find('>div')
        .hide()
        .filter('.am-datepicker-' + DPGlobal.modes[this.viewMode].clsName)
        .show();
  },

  isOutView: function() {
    var offset = this.component ?
        this.component.offset() : this.element.offset();
    var isOutView = {
      outRight: false,
      outBottom: false
    };
    var $picker = this.picker;
    var width = offset.left + $picker.outerWidth(true);
    var height = offset.top + $picker.outerHeight(true) + this.element.innerHeight();

    if (width > $doc.width()) {
      isOutView.outRight = true;
    }
    if (height > $doc.height()) {
      isOutView.outBottom = true;
    }
    return isOutView;
  },

  browserLanguage: function() {
    var language = navigator.language && navigator.language.split('-');
    language[1] = language[1].toUpperCase();
    language = language.join('_');
    if (!Object.prototype.hasOwnProperty.call(Datepicker.locales, language)) {
      language = 'en_US';
    }
    return language;
  },

  addTheme: function() {
    if (this.theme) {
      this.picker.addClass('am-datepicker-' + this.theme);
    }
  }
};

Datepicker.DEFAULTS = {
  format: 'yyyy/mm/dd',
  weekStart: 0,
  viewMode: 0,
  minViewMode: 0,
  date: '',
  theme: ''
};

// Datepicker locales

Datepicker.locales = {
  en_US: {
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    daysMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthsShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  zh_CN: {
    days: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    daysShort: ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    daysMin: ['日', '一', '二', '三', '四', '五', '六', '日'],
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    monthsShort: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    year: ['年']
  }
};

var DPGlobal = {
  modes: [
    {
      clsName: 'days',
      navFnc: 'Month',
      navStep: 1
    },
    {
      clsName: 'months',
      navFnc: 'FullYear',
      navStep: 1
    },
    {
      clsName: 'years',
      navFnc: 'FullYear',
      navStep: 10
    }
  ],
  isLeapYear: function(year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0))
  },
  getDaysInMonth: function(year, month) {
    return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month]
  },
  parseFormat: function(format) {
    var separator = format.match(/[.\/\-\s].*?/);
    var parts = format.split(/\W+/);

    if (!separator || !parts || parts.length === 0) {
      throw new Error('Invalid date format.');
    }
    return {
      separator: separator,
      parts: parts
    };
  },
  parseDate: function(date, format) {
    var parts = date.split(format.separator);
    var date = new Date();
    var val;

    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    if (parts.length === format.parts.length) {
      var year = date.getFullYear();
      var day = date.getDate();
      var month = date.getMonth();

      for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
        val = parseInt(parts[i], 10) || 1;
        switch (format.parts[i]) {
          case 'dd':
          case 'd':
            day = val;
            date.setDate(val);
            break;
          case 'mm':
          case 'm':
            month = val - 1;
            date.setMonth(val - 1);
            break;
          case 'yy':
            year = 2000 + val;
            date.setFullYear(2000 + val);
            break;
          case 'yyyy':
            year = val;
            date.setFullYear(val);
            break;
        }
      }
      date = new Date(year, month, day, 0, 0, 0);
    }
    return date;
  },
  formatDate: function(date, format) {
    var val = {
      d: date.getDate(),
      m: date.getMonth() + 1,
      yy: date.getFullYear().toString().substring(2),
      yyyy: date.getFullYear()
    };
    var date = [];

    val.dd = (val.d < 10 ? '0' : '') + val.d;
    val.mm = (val.m < 10 ? '0' : '') + val.m;

    for (var i = 0, cnt = format.parts.length; i < cnt; i++) {
      date.push(val[format.parts[i]]);
    }
    return date.join(format.separator);
  },
  headTemplate: '<thead>' +
      '<tr class="am-datepicker-header">' +
      '<th class="am-datepicker-prev"><i class="am-datepicker-prev-icon"></i></th>' +
      '<th colspan="5" class="am-datepicker-switch"><div class="am-datepicker-select"></div></th>' +
      '<th class="am-datepicker-next"><i class="am-datepicker-next-icon"></i></th>' +
      '</tr>' +
      '</thead>',
  contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>'
};

DPGlobal.template = '<div class="am-datepicker am-datepicker-dropdown"><div class="am-datepicker-caret"></div>' +
    '<div class="am-datepicker-days">' +
    '<table class="am-datepicker-table">' +
    DPGlobal.headTemplate +
    '<tbody></tbody>' +
    '</table>' +
    '</div>' +
    '<div class="am-datepicker-months">' +
    '<table class="am-datepicker-table">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    '</table>' +
    '</div>' +
    '<div class="am-datepicker-years">' +
    '<table class="am-datepicker-table">' +
    DPGlobal.headTemplate +
    DPGlobal.contTemplate +
    '</table>' +
    '</div>' +
    '</div>';

$.fn.datepicker = function(option, val) {
  return this.each(function() {
    var $this = $(this);
    var data = $this.data('amui.datepicker');

    var options = $.extend({}, Datepicker.DEFAULTS,
        UI.utils.options($this.attr('data-am-datepicker')),
            typeof option === 'object' && option);

    if (!data) {
      $this.data('amui.datepicker', (data = new Datepicker(this,
          $.extend({}, $.fn.datepicker.defaults, options))));
    }
    if (typeof option === 'string') {
      data[option](val);
    }
  });
};

$.fn.datepicker.defaults = {
  onRender: function(date) {
    return '';
  }
};

$.fn.datepicker.Constructor = Datepicker;

// Init code
$(document).on('ready', function(e) {
  $('[data-am-datepicker]').datepicker();
});

$.AMUI.datepicker = Datepicker;

module.exports = Datepicker;

// TODO: 1. 载入动画
//       2. less 优化
