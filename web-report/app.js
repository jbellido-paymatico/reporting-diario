(function (global) {
  'use strict';

  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeReports(reports) {
    if (!Array.isArray(reports)) return [];
    return reports
      .filter((report) => report && DATE_PATTERN.test(report.fecha) && typeof report.contenido === 'string')
      .slice()
      .sort((left, right) => right.fecha.localeCompare(left.fecha));
  }

  function resolveReport(reports, requestedDate, today) {
    const available = normalizeReports(reports);
    if (requestedDate) {
      const report = DATE_PATTERN.test(requestedDate)
        ? available.find((candidate) => candidate.fecha === requestedDate) || null
        : null;
      return {
        report,
        selectedDate: requestedDate,
        missingToday: false,
        requestedMissing: report === null
      };
    }

    const todayReport = available.find((candidate) => candidate.fecha === today) || null;
    if (todayReport) {
      return {
        report: todayReport,
        selectedDate: todayReport.fecha,
        missingToday: false,
        requestedMissing: false
      };
    }

    const fallback = available.find((candidate) => candidate.fecha < today) || null;
    return {
      report: fallback,
      selectedDate: fallback ? fallback.fecha : null,
      missingToday: true,
      requestedMissing: false
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isSafeUrl(value) {
    const url = String(value).trim();
    if (!url || /[\u0000-\u001f\u007f]/.test(url)) return false;
    if (/^(https?:|mailto:)/i.test(url)) return true;
    return /^(#|\.\.?\/|\/)/.test(url) || !/^[a-z][a-z\d+.-]*:/i.test(url);
  }

  function inlineMarkup(source) {
    const tokens = [];
    const stash = (html) => {
      const token = `\u0000${tokens.length}\u0000`;
      tokens.push(html);
      return token;
    };

    let text = String(source);
    text = text.replace(/`([^`]+)`/g, (_, code) => stash(`<code>${escapeHtml(code)}</code>`));
    text = text.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_, label, rawUrl) => {
      const url = rawUrl.trim();
      const safeLabel = escapeHtml(label)
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
      if (!isSafeUrl(url)) return stash(`<span class="unsafe-link">${safeLabel}</span>`);
      const external = /^(https?:|mailto:)/i.test(url);
      const attributes = external ? ' target="_blank" rel="noopener noreferrer"' : '';
      return stash(`<a href="${escapeHtml(url)}"${attributes}>${safeLabel}</a>`);
    });

    text = escapeHtml(text)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/__([^_]+)__/g, '<strong>$1</strong>')
      .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
      .replace(/_([^_\n]+)_/g, '<em>$1</em>');

    return text.replace(/\u0000(\d+)\u0000/g, (_, index) => tokens[Number(index)]);
  }

  function isTableDivider(line) {
    const cells = line.trim().replace(/^\||\|$/g, '').split('|');
    return cells.length > 0 && cells.every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
  }

  function tableCells(line) {
    return line.trim().replace(/^\||\|$/g, '').split('|').map((cell) => cell.trim());
  }

  function startsBlock(lines, index) {
    const line = lines[index] || '';
    if (!line.trim()) return true;
    if (/^(#{1,6})\s+/.test(line) || /^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) return true;
    if (/^```/.test(line) || /^>\s?/.test(line) || /^\s*[-+*]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) return true;
    return index + 1 < lines.length && line.includes('|') && isTableDivider(lines[index + 1]);
  }

  function markdownToHtml(markdown) {
    const lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (heading) {
        const level = heading[1].length;
        html.push(`<h${level}>${inlineMarkup(heading[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^\s*([-*_])(?:\s*\1){2,}\s*$/.test(line)) {
        html.push('<hr>');
        index += 1;
        continue;
      }

      if (/^```/.test(line)) {
        const code = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index])) {
          code.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
        continue;
      }

      if (line.includes('|') && index + 1 < lines.length && isTableDivider(lines[index + 1])) {
        const headers = tableCells(line);
        index += 2;
        const rows = [];
        while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
          rows.push(tableCells(lines[index]));
          index += 1;
        }
        const head = headers.map((cell) => `<th scope="col">${inlineMarkup(cell)}</th>`).join('');
        const body = rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td>${inlineMarkup(row[cellIndex] || '')}</td>`).join('')}</tr>`).join('');
        html.push(`<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
        continue;
      }

      const unordered = line.match(/^\s*[-+*]\s+(.+)$/);
      const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (unordered || ordered) {
        const tag = unordered ? 'ul' : 'ol';
        const items = [];
        const pattern = unordered ? /^\s*[-+*]\s+(.+)$/ : /^\s*\d+[.)]\s+(.+)$/;
        while (index < lines.length) {
          const match = lines[index].match(pattern);
          if (!match) break;
          items.push(`<li>${inlineMarkup(match[1])}</li>`);
          index += 1;
        }
        html.push(`<${tag}>${items.join('')}</${tag}>`);
        continue;
      }

      if (/^>\s?/.test(line)) {
        const quote = [];
        while (index < lines.length && /^>\s?/.test(lines[index])) {
          quote.push(lines[index].replace(/^>\s?/, ''));
          index += 1;
        }
        html.push(`<blockquote>${inlineMarkup(quote.join(' '))}</blockquote>`);
        continue;
      }

      const paragraph = [line.trim()];
      index += 1;
      while (index < lines.length && !startsBlock(lines, index)) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      html.push(`<p>${inlineMarkup(paragraph.join(' '))}</p>`);
    }

    return html.join('\n');
  }

  function localISODate(date) {
    const value = date || new Date();
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function formatLongDate(date) {
    if (!DATE_PATTERN.test(date || '')) return '';
    const parsed = new Date(`${date}T12:00:00`);
    const formatted = new Intl.DateTimeFormat('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(parsed);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  function shortDateParts(value) {
    const date = new Date(`${value}T00:00:00`);
    return {
      day: String(date.getDate()).padStart(2, '0'),
      weekday: new Intl.DateTimeFormat('es-ES', { weekday: 'short' }).format(date).replace('.', ''),
      month: new Intl.DateTimeFormat('es-ES', { month: 'short' }).format(date).replace('.', '')
    };
  }

  function requestedDateFrom(search) {
    try {
      return new URLSearchParams(search || '').get('fecha');
    } catch (_) {
      return null;
    }
  }

  function targetUrl(locationLike, date) {
    if (locationLike && locationLike.href) {
      const url = new URL(locationLike.href);
      url.searchParams.set('fecha', date);
      return url.href;
    }
    return `?fecha=${encodeURIComponent(date)}`;
  }

  function setText(root, selector, value) {
    const element = root.querySelector(selector);
    if (element) element.textContent = value;
    return element;
  }

  function renderDayList(root, reports, selectedDate, locationLike) {
    const navigation = root.querySelector('[data-day-list]');
    if (!navigation) return;
    navigation.replaceChildren();

    if (!reports.length) {
      const empty = root.createElement('p');
      empty.className = 'archive-empty';
      empty.textContent = 'Aún no hay días indexados.';
      navigation.appendChild(empty);
      return;
    }

    reports.forEach((report) => {
      const parts = shortDateParts(report.fecha);
      const link = root.createElement('a');
      link.className = 'day-link';
      link.href = targetUrl(locationLike, report.fecha);
      link.setAttribute('aria-label', `Abrir reporte del ${formatLongDate(report.fecha)}`);
      if (report.fecha === selectedDate) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }

      const number = root.createElement('span');
      number.className = 'day-number';
      number.textContent = parts.day;
      const details = root.createElement('span');
      details.className = 'day-details';
      const weekday = root.createElement('strong');
      weekday.textContent = parts.weekday;
      const month = root.createElement('span');
      month.textContent = `${parts.month} ${report.fecha.slice(0, 4)}`;
      details.append(weekday, month);
      const arrow = root.createElement('span');
      arrow.className = 'day-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      link.append(number, details, arrow);
      navigation.appendChild(link);
    });
  }

  function renderApp(root, reports, locationLike, today) {
    const available = normalizeReports(reports);
    const requestedDate = requestedDateFrom(locationLike && locationLike.search);
    const state = resolveReport(available, requestedDate, today);
    const alert = root.querySelector('[data-missing-today]');
    const input = root.querySelector('[data-date-input]');
    const content = root.querySelector('[data-report-content]');
    const empty = root.querySelector('[data-empty-state]');

    if (alert) alert.hidden = !state.missingToday;
    setText(root, '[data-report-count]', `${available.length} ${available.length === 1 ? 'reporte' : 'reportes'}`);

    if (input) {
      input.value = state.selectedDate || requestedDate || '';
      if (available.length) {
        input.min = available[available.length - 1].fecha;
        input.max = available[0].fecha;
      }
      input.onchange = () => {
        if (!input.value) return;
        const destination = targetUrl(locationLike, input.value);
        if (locationLike && typeof locationLike.assign === 'function') locationLike.assign(destination);
      };
    }

    renderDayList(root, available, state.selectedDate, locationLike || {});

    if (state.report) {
      setText(root, '[data-report-kicker]', state.missingToday ? 'ÚLTIMO REPORTE DISPONIBLE' : 'REPORTE SELECCIONADO');
      setText(root, '[data-report-date]', formatLongDate(state.report.fecha));
      if (content) {
        content.hidden = false;
        content.innerHTML = markdownToHtml(state.report.contenido);
      }
      if (empty) empty.hidden = true;
    } else {
      const invalidRequest = Boolean(requestedDate);
      setText(root, '[data-report-kicker]', invalidRequest ? 'SIN RESULTADOS' : 'ARCHIVO VACÍO');
      setText(root, '[data-report-date]', invalidRequest && DATE_PATTERN.test(requestedDate)
        ? formatLongDate(requestedDate)
        : 'Reporting diario');
      if (content) content.hidden = true;
      if (empty) empty.hidden = false;
      setText(root, '[data-empty-title]', invalidRequest ? 'Reporte no encontrado' : 'Todavía no hay reportes');
      setText(
        root,
        '[data-empty-copy]',
        invalidRequest
          ? `No hay ningún reporte indexado para ${requestedDate}. Selecciona otra fecha del archivo.`
          : 'Ejecuta actualizar-indice.ps1 después de crear el primer resumen matutino.'
      );
    }

    return state;
  }

  global.ReportApp = {
    resolveReport,
    markdownToHtml,
    formatLongDate,
    renderApp
  };

  if (global.document) {
    global.document.addEventListener('DOMContentLoaded', () => {
      if (!global.document.querySelector('[data-report-app]')) return;
      renderApp(global.document, global.REPORTES || [], global.location, localISODate());
    });
  }
})(window);
