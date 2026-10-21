"use strict";
/* Goal Zone-only section navigation. Shared football app.js remains untouched. */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const root = document.documentElement;
    const nav = document.getElementById("gzSectionNav");
    const filters = document.getElementById("filters");
    const list = document.getElementById("matchList");
    const heading = document.getElementById("reportHeading");
    const pill = document.getElementById("reportPill");
    const empty = document.getElementById("gzSpecialEmpty");
    if (!nav || !filters || !list || !heading || !pill || !empty) return;

    const sections = ["previews", "news", "ai", "special", "results"];
    const known = new Set(sections);
    let active = "previews";
    let resetFilter = true;
    let scheduled = false;

    function requestedSection() {
      const query = new URLSearchParams(location.search).get("section");
      if (known.has(query)) return query;
      if (location.hash === "#fcNewsSection") return "news";
      if (location.hash === "#fcj-ai") return "ai";
      if (location.hash === "#gzSpecialEmpty") return "special";
      return "previews";
    }

    function setHeading() {
      const titles = {
        previews: ["ဒီနေ့ ပွဲကြိုသုံးသပ်ချက်များ", "● TODAY"],
        results: ["မနေ့က ပွဲရလဒ်များ", "● YESTERDAY"],
        special: ["★ Special Choice — အထူးရွေးချယ်ပွဲများ", "★ PICKS"]
      };
      const label = titles[active];
      if (!label) return;
      if (heading.textContent !== label[0]) heading.textContent = label[0];
      if (pill.textContent !== label[1]) pill.textContent = label[1];
    }

    function synchronizeMatches() {
      if (active === "news" || active === "ai") return;
      const desiredDay = active === "results" ? "-1" : "0";
      const day = document.querySelector('#dateTabs button[data-day="' + desiredDay + '"]');
      if (day && !day.classList.contains("active")) {
        day.click();
        setHeading();
        return;
      }

      const busy = list.getAttribute("aria-busy") === "true";
      if (active === "special") {
        const special = filters.querySelector('[data-league="special"]');
        if (special && !special.classList.contains("selected") && !busy) {
          special.click();
          setHeading();
          return;
        }
        // Never show ordinary previews in the Special Choice view.
        const absent = !busy && !special;
        empty.hidden = !absent;
        list.hidden = absent;
      } else {
        list.hidden = false;
        empty.hidden = true;
        if (resetFilter) {
          const all = filters.querySelector('[data-league="all"]');
          if (all && !all.classList.contains("selected") && !busy) {
            all.click();
          }
          if (all && all.classList.contains("selected")) resetFilter = false;
        }
      }
      setHeading();
    }

    function scheduleSync() {
      if (scheduled) return;
      scheduled = true;
      Promise.resolve().then(function () {
        scheduled = false;
        synchronizeMatches();
      });
    }

    function changeSection(next, updateUrl) {
      if (!known.has(next)) next = "previews";
      if (active !== next) resetFilter = true;
      active = next;
      root.dataset.gzSection = next;
      nav.querySelectorAll("[data-gz-section-link]").forEach(function (link) {
        const chosen = link.dataset.gzSectionLink === next;
        link.classList.toggle("active", chosen);
        if (chosen) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
      if (updateUrl) {
        const url = new URL(location.href);
        url.searchParams.set("section", next);
        url.hash = "";
        history.pushState({goalZoneSection:next}, "", url.pathname + url.search);
      }
      list.hidden = false;
      empty.hidden = true;
      synchronizeMatches();
    }

    nav.querySelectorAll("[data-gz-section-link]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        changeSection(link.dataset.gzSectionLink, true);
        window.scrollTo({top: nav.getBoundingClientRect().top + window.scrollY - 15, behavior:"auto"});
      });
    });
    window.addEventListener("popstate", function () { changeSection(requestedSection(), false); });
    window.addEventListener("hashchange", function () { changeSection(requestedSection(), false); });

    // app.js replaces filters asynchronously whenever a different day loads.
    // Reapply only the category mode; preserve the visitor's league filter.
    const observer = new MutationObserver(scheduleSync);
    observer.observe(filters, {childList:true});
    observer.observe(list, {attributes:true, attributeFilter:["aria-busy"]});
    observer.observe(heading, {childList:true, subtree:true, characterData:true});
    observer.observe(pill, {childList:true, subtree:true, characterData:true});

    changeSection(requestedSection(), false);
  });
})();
