(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var canAnimate = !reduceMotion;
  /* Cursor-driven effects (glow, magnetic pull, tilt) only make sense with a
     real pointer, and must sit out under reduced-motion. */
  var cursorFX = finePointer && !reduceMotion;

  /* ============================================================
     Floating dock: mobile toggle
     ============================================================ */
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ============================================================
     Scroll-spy: fills the brass circle behind the in-view dock icon
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
      { threshold: [0.3, 0.6], rootMargin: "-10% 0px -45% 0px" }
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

    var galleryHtml = "";
    if (data.gallery && data.gallery.length) {
      galleryHtml =
        '<div class="cs-block cs-gallery-block"><h4>Screens</h4><div class="cs-gallery">' +
        data.gallery
          .map(function (g) {
            return (
              '<figure class="cs-gallery-item">' +
              '<a href="' + g.src + '" target="_blank" rel="noopener">' +
              '<img src="' + g.src + '" alt="' + g.caption + '" loading="lazy">' +
              "</a>" +
              '<figcaption>' + g.caption + "</figcaption>" +
              "</figure>"
            );
          })
          .join("") +
        "</div></div>";
    }

    modalBody.innerHTML =
      '<div class="cs-block"><h4>Overview</h4><p>' + data.overview + "</p></div>" +
      galleryHtml +
      '<div class="cs-block"><h4>The problem</h4><p>' + data.challenge + "</p></div>" +
      '<div class="cs-block"><h4>What I built</h4><p>' + data.solution + "</p></div>" +
      '<div class="cs-meta-row">' +
      '<div><span class="cs-meta-label">Role</span><p>' + data.role + "</p></div>" +
      '<div><span class="cs-meta-label">Duration</span><p>' + data.duration + "</p></div>" +
      "</div>" +
      '<div class="cs-block"><h4>Highlights</h4><ul class="cs-highlights">' + highlightsHtml + "</ul></div>";

    var actionsHtml = "";
    if (data.liveUrl) {
      actionsHtml += '<a class="btn btn-accent" href="' + data.liveUrl + '" target="_blank" rel="noopener">View live site ↗</a>';
    }
    if (data.sourceUrl) {
      actionsHtml += '<a class="btn btn-ghost" href="' + data.sourceUrl + '" target="_blank" rel="noopener">View source ↗</a>';
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

  /* ============================================================
     Effect 1: parallax on the oversized opening headline.
     Drifts a fraction of scroll distance, so it lags the foreground.
     ============================================================ */
  var backdrop = document.querySelector(".opening-backdrop");
  if (backdrop && canAnimate) {
    var ticking = false;
    var onParallax = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = window.scrollY * 0.12;
        backdrop.style.transform = "translate(-50%, calc(-50% + " + y.toFixed(1) + "px))";
        ticking = false;
      });
    };
    window.addEventListener("scroll", onParallax, { passive: true });
    onParallax();
  }

  /* ============================================================
     Effect 7: scroll-reveal stagger. One pass per section, ~70ms
     between siblings. Base state is visible; only opt in when we can
     actually animate, so no-JS / reduced-motion keep everything shown.
     ============================================================ */
  if (canAnimate && "IntersectionObserver" in window) {
    document.documentElement.classList.add("js-anim");

    var revealGroups = [
      ".opening-copy > *", ".opening-proof > *",
      "#work .section-head > *", ".work-group-label", ".work-feature", ".work-card",
      "#capability .section-head > *", ".spec-row",
      "#process .section-head > *", ".phase",
      "#record .section-head > *", ".record-row", ".toolkit-col",
      "#contact .section-head > *", ".contact-form", ".contact-block > *"
    ];

    var revEls = [];
    revealGroups.forEach(function (sel) {
      Array.prototype.slice.call(document.querySelectorAll(sel)).forEach(function (el, i) {
        el.classList.add("reveal");
        el.style.transitionDelay = (Math.min(i, 6) * 0.07).toFixed(2) + "s";
        revEls.push(el);
      });
    });

    var revObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            revObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.01, rootMargin: "0px 0px -8% 0px" }
    );
    revEls.forEach(function (el) {
      revObserver.observe(el);
    });
  }

  /* ============================================================
     Effect 7: animated stat counters. Count up once from 0 on view.
     ============================================================ */
  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-count]"));
  if (counters.length && "IntersectionObserver" in window) {
    var countObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          countObs.unobserve(el);
          var target = parseFloat(el.getAttribute("data-count")) || 0;
          if (reduceMotion) {
            el.textContent = String(target);
            return;
          }
          var dur = 800;
          var start = null;
          var step = function (ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = String(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = String(target);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) {
      countObs.observe(el);
    });
  }

  /* ============================================================
     Effect 7: cursor-reactive glow on dark sections.
     A .section-glow layer is injected (decorative); its gradient
     centre follows the pointer through --x / --y custom properties.
     ============================================================ */
  var darkSections = Array.prototype.slice.call(document.querySelectorAll(".section--dark"));
  darkSections.forEach(function (sec) {
    var glow = document.createElement("div");
    glow.className = "section-glow";
    glow.setAttribute("aria-hidden", "true");
    sec.insertBefore(glow, sec.firstChild);

    if (!cursorFX) return;
    sec.addEventListener("mousemove", function (e) {
      var r = sec.getBoundingClientRect();
      sec.style.setProperty("--x", (e.clientX - r.left) + "px");
      sec.style.setProperty("--y", (e.clientY - r.top) + "px");
      sec.classList.add("is-glowing");
    });
    sec.addEventListener("mouseleave", function () {
      sec.classList.remove("is-glowing");
    });
  });

  /* ============================================================
     Effect 7: magnetic pull on the accent buttons and dock icons.
     A few px of travel toward the cursor, CSS transition springs back.
     ============================================================ */
  if (cursorFX) {
    var magnets = Array.prototype.slice.call(
      document.querySelectorAll(".btn-accent, .site-nav a .dock-ico")
    );
    magnets.forEach(function (el) {
      var host = el.classList.contains("dock-ico") ? el.parentNode : el;
      host.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var mx = e.clientX - (r.left + r.width / 2);
        var my = e.clientY - (r.top + r.height / 2);
        el.style.transform = "translate(" + (mx * 0.25).toFixed(1) + "px, " + (my * 0.25).toFixed(1) + "px)";
      });
      host.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ============================================================
     Effect 7: light 3D tilt on the work-feature and bento cards.
     Capped at 5deg so it reads as polish, not a toy.
     ============================================================ */
  if (cursorFX) {
    var tilters = Array.prototype.slice.call(
      document.querySelectorAll(".work-feature, .toolkit-col")
    );
    var MAX_TILT = 5;
    tilters.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform =
          "perspective(800px) rotateX(" + (-py * MAX_TILT).toFixed(2) +
          "deg) rotateY(" + (px * MAX_TILT).toFixed(2) + "deg)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  /* ============================================================
     Contact form: Formspree submission with inline validation.

     GitHub Pages is static hosting, so the form is delivered by
     Formspree (free tier: 50 submissions / month). The <form> keeps
     a mailto action purely as a no-JS fallback; when JS runs we
     take over the submit here.

     SETUP: create a form at https://formspree.io, then paste its
     endpoint (https://formspree.io/f/xxxxxxxx) into FORMSPREE_ENDPOINT
     below. Until that is done, submitting hands off to the visitor's
     email client instead so the form still does something useful.
     ============================================================ */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    // TODO(jeoff): replace REPLACE_WITH_FORM_ID with your real Formspree form ID.
    var FORMSPREE_ENDPOINT = "https://formspree.io/f/REPLACE_WITH_FORM_ID";
    var CONTACT_EMAIL = "Jeoffreysherren01@gmail.com";
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // JS owns validation now, so switch off the browser's native bubbles.
    // (If JS never runs, native `required` + the mailto action still apply.)
    contactForm.setAttribute("novalidate", "");

    var statusEl = document.getElementById("formStatus");
    var submitBtn = contactForm.querySelector('button[type="submit"]');
    var projectEl = document.getElementById("project");

    var fields = {
      name: { el: document.getElementById("name"), err: document.getElementById("err-name") },
      email: { el: document.getElementById("email"), err: document.getElementById("err-email") },
      message: { el: document.getElementById("message"), err: document.getElementById("err-message") }
    };

    function setFieldError(f, message) {
      f.err.textContent = message;
      f.el.setAttribute("aria-invalid", "true");
    }
    function clearFieldError(f) {
      f.err.textContent = "";
      f.el.removeAttribute("aria-invalid");
    }
    function setStatus(kind, html) {
      statusEl.hidden = false;
      statusEl.className = "form-status form-status--" + kind;
      statusEl.innerHTML = html;
    }
    function clearStatus() {
      statusEl.hidden = true;
      statusEl.className = "form-status";
      statusEl.textContent = "";
    }

    // Clear a field's error as soon as the visitor starts correcting it.
    Object.keys(fields).forEach(function (key) {
      fields[key].el.addEventListener("input", function () {
        clearFieldError(fields[key]);
      });
    });

    function validate() {
      var firstInvalid = null;

      if (!fields.name.el.value.trim()) {
        setFieldError(fields.name, "Please enter your name.");
        firstInvalid = firstInvalid || fields.name.el;
      } else {
        clearFieldError(fields.name);
      }

      var email = fields.email.el.value.trim();
      if (!email) {
        setFieldError(fields.email, "Please enter your email.");
        firstInvalid = firstInvalid || fields.email.el;
      } else if (!EMAIL_RE.test(email)) {
        setFieldError(fields.email, "That doesn't look like a valid email address.");
        firstInvalid = firstInvalid || fields.email.el;
      } else {
        clearFieldError(fields.email);
      }

      if (!fields.message.el.value.trim()) {
        setFieldError(fields.message, "Please include a short message.");
        firstInvalid = firstInvalid || fields.message.el;
      } else {
        clearFieldError(fields.message);
      }

      if (firstInvalid) {
        firstInvalid.focus();
        return false;
      }
      return true;
    }

    // A pre-filled mailto, offered as a recovery link if the network send fails.
    function mailtoHref() {
      var subject = "Portfolio enquiry from " + (fields.name.el.value.trim() || "a visitor");
      var body =
        "Name: " + fields.name.el.value.trim() + "\n" +
        "Email: " + fields.email.el.value.trim() + "\n" +
        "Project type: " + projectEl.value + "\n\n" +
        fields.message.el.value.trim();
      return "mailto:" + CONTACT_EMAIL +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);
    }

    function showFailure() {
      setStatus(
        "error",
        "Something went wrong sending that. Please try again in a moment, or " +
        '<a href="' + mailtoHref() + '">email it to me directly</a>.'
      );
    }

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      clearStatus();
      if (!validate()) return;

      // Endpoint not configured yet: fall back to the visitor's mail client.
      if (FORMSPREE_ENDPOINT.indexOf("REPLACE_WITH_FORM_ID") !== -1) {
        setStatus("notice", "Opening your email app so you can send this to me directly…");
        window.location.href = mailtoHref();
        return;
      }

      var originalLabel = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(contactForm)
      })
        .then(function (res) {
          if (res.ok) {
            contactForm.reset();
            setStatus(
              "success",
              "Thanks — your message is on its way. I'll reply within a day or two."
            );
            return;
          }
          return res.json().then(function (data) {
            if (data && Array.isArray(data.errors) && data.errors.length) {
              setStatus("error", data.errors.map(function (x) { return x.message; }).join(" "));
            } else {
              showFailure();
            }
          });
        })
        .catch(showFailure)
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        });
    });
  }
})();
