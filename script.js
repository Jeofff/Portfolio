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
    ".spec-row, .work-row, .phase, .record-row, .toolkit-col, .opening-copy, .contact-block"
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
})();
