(function(){
  "use strict";

  var topbar = document.getElementById("topbar");
  var sheetLabel = document.getElementById("sheetLabel");
  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");
  var railItems = Array.prototype.slice.call(document.querySelectorAll("#railIndex li"));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll("[data-nav]"));
  var sections = Array.prototype.slice.call(document.querySelectorAll("main .section"));

  /* Topbar background on scroll */
  function onScroll(){
    topbar.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile nav toggle */
  if (navToggle && siteNav){
    navToggle.addEventListener("click", function(){
      var open = siteNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    siteNav.addEventListener("click", function(e){
      if (e.target.tagName === "A"){
        siteNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* Scroll-spy: rail, sheet label, nav underline */
  if (sections.length && "IntersectionObserver" in window){
    var current = sections[0];

    var spy = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting && entry.intersectionRatio > 0.3){
          current = entry.target;
          updateActive(current);
        }
      });
    }, { threshold: [0.3, 0.6], rootMargin: "-72px 0px -40% 0px" });

    sections.forEach(function(s){ spy.observe(s); });

    function updateActive(section){
      var id = section.id;
      var sheet = section.getAttribute("data-sheet");
      var label = section.getAttribute("data-label");

      if (sheetLabel && sheet && label){
        sheetLabel.textContent = "Sheet " + sheet + "/07: " + label;
      }

      railItems.forEach(function(li){
        li.classList.toggle("is-active", li.getAttribute("data-rail") === id);
      });

      navLinks.forEach(function(a){
        var target = a.getAttribute("href").replace("#", "");
        a.classList.toggle("is-active", target === id);
      });
    }
  }

  /* Reveal-on-scroll for content rows */
  var revealTargets = document.querySelectorAll(
    ".spec-row, .work-feature, .work-card, .phase, .record-row, .toolkit-col, .opening-copy, .contact-block"
  );
  revealTargets.forEach(function(el){ el.setAttribute("data-reveal", ""); });

  if ("IntersectionObserver" in window){
    var reveal = new IntersectionObserver(function(entries, obs){
      entries.forEach(function(entry){
        if (entry.isIntersecting){
          entry.target.classList.add("is-visible");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    revealTargets.forEach(function(el){ reveal.observe(el); });
  } else {
    revealTargets.forEach(function(el){ el.classList.add("is-visible"); });
  }

  /* Case study modal (Work section) */
  var csTriggers = Array.prototype.slice.call(document.querySelectorAll("[data-project]"));
  var csOverlay = document.getElementById("csModalOverlay");

  if (csTriggers.length && csOverlay && typeof PROJECTS_DATA !== "undefined"){
    var csModal = document.getElementById("csModal");
    var csClose = document.getElementById("csModalClose");
    var csBadges = document.getElementById("csModalBadges");
    var csTitle = document.getElementById("csModalTitle");
    var csCategory = document.getElementById("csModalCategory");
    var csBody = document.getElementById("csModalBody");
    var csActions = document.getElementById("csModalActions");
    var csLastFocused = null;

    function csRow(label, value){
      if (!value) return "";
      return '<div class="cs-row"><dt>' + label + '</dt><dd>' + value + '</dd></div>';
    }

    function csChipRow(label, chips, className){
      if (!chips || !chips.length) return "";
      var items = chips.map(function(c){ return '<span class="chip ' + className + '">' + c + '</span>'; }).join("");
      return '<div class="cs-row"><dt>' + label + '</dt><dd><div class="cs-highlight-list">' + items + '</div></dd></div>';
    }

    function openCaseStudy(trigger){
      var id = trigger.getAttribute("data-project");
      var data = PROJECTS_DATA[id];
      if (!data) return;

      csLastFocused = trigger;

      var badgeEls = trigger.querySelectorAll(".work-badge");
      csBadges.innerHTML = Array.prototype.map.call(badgeEls, function(b){ return b.outerHTML; }).join("");

      var titleEl = trigger.querySelector("h3");
      csTitle.textContent = titleEl ? titleEl.textContent : "";

      var categoryEl = trigger.querySelector(".work-category");
      csCategory.textContent = categoryEl ? categoryEl.textContent : "";

      var stackEls = trigger.querySelectorAll(".chip-stack");
      var stackList = Array.prototype.map.call(stackEls, function(c){ return c.textContent; });

      csBody.innerHTML =
        csRow("Overview", data.overview) +
        csRow("Challenge", data.challenge) +
        csRow("Solution", data.solution) +
        csChipRow("Technology", stackList, "chip-stack") +
        csRow("Role", data.role) +
        csRow("Duration", data.duration) +
        csChipRow("Highlights", data.highlights, "chip-result");

      var actions = "";
      if (data.liveUrl){
        actions += '<a class="btn btn-accent" href="' + data.liveUrl + '" target="_blank" rel="noopener">Visit website</a>';
      }
      if (data.sourceUrl){
        actions += '<a class="btn btn-ghost" href="' + data.sourceUrl + '" target="_blank" rel="noopener">View source</a>';
      }
      actions += '<button class="btn btn-ghost" type="button" data-cs-dismiss>Close</button>';
      csActions.innerHTML = actions;

      csOverlay.hidden = false;
      requestAnimationFrame(function(){ csOverlay.classList.add("is-open"); });
      document.body.style.overflow = "hidden";
      csClose.focus();

      document.addEventListener("keydown", onCsKeydown);
    }

    function closeCaseStudy(){
      csOverlay.classList.remove("is-open");
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onCsKeydown);
      window.setTimeout(function(){ csOverlay.hidden = true; }, 250);
      if (csLastFocused) csLastFocused.focus();
    }

    function onCsKeydown(e){
      if (e.key === "Escape"){
        closeCaseStudy();
        return;
      }
      if (e.key === "Tab"){
        var focusable = csModal.querySelectorAll('a[href], button:not([disabled])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first){
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last){
          e.preventDefault(); first.focus();
        }
      }
    }

    csTriggers.forEach(function(trigger){
      trigger.addEventListener("click", function(){ openCaseStudy(trigger); });
    });

    csClose.addEventListener("click", closeCaseStudy);
    csOverlay.addEventListener("click", function(e){
      if (e.target === csOverlay) closeCaseStudy();
    });
    csActions.addEventListener("click", function(e){
      if (e.target.hasAttribute("data-cs-dismiss")) closeCaseStudy();
    });
  }
})();
