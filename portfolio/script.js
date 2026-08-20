(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     Payroll calculator — the signature element.
     Figures below are drawn from the 2026 SSS, PhilHealth, Pag-IBIG,
     and BIR (TRAIN Law) schedules, current as of this build. This is
     a portfolio demonstration of real compliance math, not a
     certified payroll product — brackets simplify slightly where the
     official tables step in fine increments, but the rates, floors,
     ceilings, and splits are the real ones.
     ============================================================ */

  function computeSSS(salary) {
    // 15% of Monthly Salary Credit, floor 5,000, ceiling 35,000,
    // MSC approximated to the nearest 500 to mirror the official
    // bracket steps without reproducing all ~60 rows.
    var msc = Math.min(Math.max(Math.round(salary / 500) * 500, 5000), 35000);
    var employee = msc * 0.05;
    var ec = msc < 15000 ? 10 : 30;
    var employer = msc * 0.10 + ec;
    return { employee: employee, employer: employer, basis: msc, label: "SSS" };
  }

  function computePhilHealth(salary) {
    // 5% of monthly basic salary, split evenly, floor 10,000 (₱500
    // total), ceiling 100,000 (₱5,000 total).
    var basis = Math.min(Math.max(salary, 10000), 100000);
    var total = basis * 0.05;
    return { employee: total / 2, employer: total / 2, basis: basis, label: "PhilHealth" };
  }

  function computePagIbig(salary) {
    // 2%/2% up to a ₱10,000 salary cap (max ₱200 each). Employees
    // earning ₱1,500 or below pay 1% instead; the employer share
    // stays at 2% either way.
    var basis = Math.min(salary, 10000);
    var employeeRate = salary <= 1500 ? 0.01 : 0.02;
    return { employee: basis * employeeRate, employer: basis * 0.02, basis: basis, label: "Pag-IBIG" };
  }

  function computeWithholdingTax(taxableMonthly) {
    // TRAIN Law (RA 10963) brackets, effective 2023 onward and still
    // current for 2026, expressed at their monthly equivalent
    // (annual threshold and fixed amount both / 12).
    var t = taxableMonthly;
    if (t <= 20833.33) return 0;
    if (t <= 33333.33) return (t - 20833.33) * 0.15;
    if (t <= 66666.67) return 1875.00 + (t - 33333.33) * 0.20;
    if (t <= 166666.67) return 8541.67 + (t - 66666.67) * 0.25;
    if (t <= 666666.67) return 33541.67 + (t - 166666.67) * 0.30;
    return 183541.67 + (t - 666666.67) * 0.35;
  }

  function peso(n) {
    return "\u20b1" + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function runCalculator() {
    var input = document.getElementById("calcSalary");
    var out = document.getElementById("calcResults");
    if (!input || !out) return;

    var raw = parseFloat(input.value.replace(/,/g, ""));
    if (isNaN(raw) || raw <= 0) {
      out.innerHTML = '<p class="calc-empty">Enter a monthly salary to see the breakdown.</p>';
      out.classList.remove("is-computed");
      return;
    }

    var sss = computeSSS(raw);
    var philhealth = computePhilHealth(raw);
    var pagibig = computePagIbig(raw);
    var totalEeDeductions = sss.employee + philhealth.employee + pagibig.employee;
    var taxable = Math.max(raw - totalEeDeductions, 0);
    var tax = computeWithholdingTax(taxable);
    var netPay = raw - totalEeDeductions - tax;

    var rows = [
      { label: "SSS", basis: sss.basis, amount: sss.employee },
      { label: "PhilHealth", basis: philhealth.basis, amount: philhealth.employee },
      { label: "Pag-IBIG", basis: pagibig.basis, amount: pagibig.employee },
      { label: "Withholding tax", basis: taxable, amount: tax }
    ];

    var rowsHtml = rows.map(function (r) {
      return (
        '<div class="calc-row">' +
        '<span class="calc-row-label">' + r.label + '</span>' +
        '<span class="calc-row-amount">\u2212' + peso(r.amount) + "</span>" +
        "</div>"
      );
    }).join("");

    out.innerHTML =
      rowsHtml +
      '<div class="calc-row calc-row-total">' +
      '<span class="calc-row-label">Net pay</span>' +
      '<span class="calc-row-amount calc-net">' + peso(netPay) + "</span>" +
      "</div>" +
      '<p class="calc-footnote">Employer also pays ' + peso(sss.employer + philhealth.employer + pagibig.employer) +
      " in matching SSS, PhilHealth, and Pag-IBIG contributions on top of this, not deducted from the employee.</p>";

    out.classList.add("is-computed");
  }

  var calcInput = document.getElementById("calcSalary");
  if (calcInput) {
    calcInput.addEventListener("input", runCalculator);
    runCalculator();
  }

  var calcPresets = document.querySelectorAll("[data-preset-salary]");
  calcPresets.forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (calcInput) {
        calcInput.value = btn.getAttribute("data-preset-salary");
        runCalculator();
        calcInput.focus();
      }
    });
  });

  /* ============================================================
     Top bar + mobile nav
     ============================================================ */
  var topbar = document.getElementById("topbar");
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  function onScroll() {
    if (topbar) topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ============================================================
     Scroll-spy for nav underline
     ============================================================ */
  var sections = Array.prototype.slice.call(document.querySelectorAll("main .section"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));

  if (sections.length && "IntersectionObserver" in window) {
    var spy = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            var id = entry.target.id;
            navLinks.forEach(function (a) {
              a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
            });
          }
        });
      },
      { threshold: [0.3, 0.6], rootMargin: "-72px 0px -40% 0px" }
    );
    sections.forEach(function (s) {
      spy.observe(s);
    });
  }

  /* ============================================================
     Case study modal
     ============================================================ */
  var overlay = document.getElementById("csModalOverlay");
  var modal = document.getElementById("csModal");
  var modalClose = document.getElementById("csModalClose");
  var modalTitle = document.getElementById("csModalTitle");
  var modalCategory = document.getElementById("csModalCategory");
  var modalBody = document.getElementById("csModalBody");
  var modalActions = document.getElementById("csModalActions");
  var lastFocused = null;

  function openCaseStudy(key, titleText, categoryText) {
    if (typeof PROJECTS_DATA === "undefined" || !PROJECTS_DATA[key]) return;
    var data = PROJECTS_DATA[key];

    modalTitle.textContent = titleText;
    modalCategory.textContent = categoryText;

    var highlightsHtml = data.highlights
      .map(function (h) {
        return "<li>" + h + "</li>";
      })
      .join("");

    modalBody.innerHTML =
      '<div class="cs-block"><h4>Overview</h4><p>' + data.overview + "</p></div>" +
      '<div class="cs-block"><h4>The problem</h4><p>' + data.challenge + "</p></div>" +
      '<div class="cs-block"><h4>What I built</h4><p>' + data.solution + "</p></div>" +
      '<div class="cs-meta-row">' +
      '<div><span class="cs-meta-label">Role</span><p>' + data.role + "</p></div>" +
      '<div><span class="cs-meta-label">Duration</span><p>' + data.duration + "</p></div>" +
      "</div>" +
      '<div class="cs-block"><h4>Highlights</h4><ul class="cs-highlights">' + highlightsHtml + "</ul></div>";

    var actionsHtml = "";
    if (data.liveUrl) {
      actionsHtml += '<a class="btn btn-accent" href="' + data.liveUrl + '" target="_blank" rel="noopener">View live site \u2197</a>';
    }
    if (data.sourceUrl) {
      actionsHtml += '<a class="btn btn-ghost" href="' + data.sourceUrl + '" target="_blank" rel="noopener">View source \u2197</a>';
    }
    modalActions.innerHTML = actionsHtml;

    lastFocused = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    modalClose.focus();
    document.addEventListener("keydown", onModalKeydown);
  }

  function closeCaseStudy() {
    overlay.hidden = true;
    document.body.classList.remove("modal-open");
    document.removeEventListener("keydown", onModalKeydown);
    if (lastFocused) lastFocused.focus();
  }

  function onModalKeydown(e) {
    if (e.key === "Escape") {
      closeCaseStudy();
      return;
    }
    if (e.key === "Tab") {
      var focusable = modal.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  document.querySelectorAll("[data-project]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var key = btn.getAttribute("data-project");
      var titleEl = btn.querySelector("h3");
      var catEl = btn.querySelector(".work-category");
      openCaseStudy(key, titleEl ? titleEl.textContent : "", catEl ? catEl.textContent : "");
    });
  });

  if (modalClose) modalClose.addEventListener("click", closeCaseStudy);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeCaseStudy();
    });
  }
})();
