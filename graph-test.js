let graphData = null;

fetch("graph-data.php")
  .then(r => r.json())
  .then(data => {
    graphData = data;
    renderGraph(data);
  })
  .catch(err => {
    console.error(err);
    d3.select("#graph").append("div").text("Failed to load graph-data.php");
  });


// graph dimensions and creating the svg
function renderGraph(data) {

  const width = 1800;
  const height = 900;

  const svg = d3.select("#graph")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%");

  const years = d3.range(1, 5);
  const heightRow = height / 4;

  svg.append("g")
    .selectAll("rect")
    .data(years)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", d => (d - 1) * heightRow)
    .attr("width", width)
    .attr("height", heightRow)
    .attr("fill", (d, i) => (i % 2 === 0 ? "rgb(255, 255, 255)" : "#f8fafc"));

  svg.append("g")
    .selectAll("line")
    .data(d3.range(1, 4))
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => d * heightRow)
    .attr("y2", d => d * heightRow)
    .attr("stroke", "#cbd5e1")
    .attr("stroke-width", 1);

  svg.append("g")
    .selectAll("text")
    .data(years)
    .enter()
    .append("text")
    .attr("x", 12)
    .attr("y", d => (d - 0.5) * heightRow)
    .attr("dy", "0.35em")
    .style("font-size", "16px")
    .style("fill", "#334155")
    .text(d => `${d}ο έτος`);


  // preparing the data and the filters ()
  let nodes = Array.isArray(data.nodes) ? data.nodes : [];
  let links = Array.isArray(data.links) ? data.links : [];

  const NOT_INCLUDED_IDS = new Set([
  "ξεν-γλω",
  "πρα-ασκ-ερα",
  "πρα-ασκ-πδε",
  "πτυ-εργ-2"
  ].map(id => id.toLowerCase()));

  nodes = nodes.filter(n => !NOT_INCLUDED_IDS.has(String(n.id || "").toLowerCase()));

  const validNodeIds = new Set(nodes.map(n => n.id));

  links = links.filter(l => {
    const sourceId = String(l.source || "").toLowerCase();
    const targetId = String(l.target || "").toLowerCase();

    return (
      validNodeIds.has(l.source) &&
      validNodeIds.has(l.target) &&
      !NOT_INCLUDED_IDS.has(sourceId) &&
      !NOT_INCLUDED_IDS.has(targetId)
    );
  });

  nodes.forEach(d => {
  d.year = Math.ceil(d.semester / 2);

  const top = (d.year - 1) * heightRow + 20;
  const bottom = d.year * heightRow - 20;

  d.yTarget = top + Math.random() * (bottom - top);
  d.y = d.yTarget;
  d.fy = d.yTarget;
  });

  const nodesGroupYear = d3.group(nodes, d => d.year);

  nodesGroupYear.forEach(nodeYears => {
    nodeYears.sort((a, b) => String(a.id).localeCompare(String(b.id)));

    const left = 260;
    const right = width - 360;
    const availableWidth = right - left;

    nodeYears.forEach((d, i) => {
      const t = nodeYears.length === 1 ? 0.5 : i / (nodeYears.length - 1);
      const moveShake = (Math.random() - 0.5) * 80;

      d.xTarget = left + t * availableWidth + moveShake;
      d.x = d.xTarget;
    });
  });

  const nodeWithId = new Map(nodes.map(n => [n.id, n]));
  const validLinks = links
    .filter(l => l && l.source != null && l.target != null && nodeWithId.has(l.source) && nodeWithId.has(l.target))
    .map(l => ({ ...l }));

  const forward = new Map();
  const reverse = new Map();


//functions that help with the graph and traversal for focus mode

//adds connections betweem nodes inside the map
  function addEdge(map, a, b) {
    if (!map.has(a)) map.set(a, []);
    map.get(a).push(b);
  }

  validLinks.forEach(l => {
    addEdge(forward, l.source, l.target);
    addEdge(reverse, l.target, l.source);
  });
  

  //traversal of the graph, finds the connected lessons
  function traverse(startId, adjacencyMap) {

    const visited = new Set([startId]);
    const stack = [startId];

    while (stack.length) {
      const current = stack.pop();
      const next = adjacencyMap.get(current) || [];

      for (const n of next) {
        if (!visited.has(n)) {
          visited.add(n);
          stack.push(n);
        }
      }
    }
    return visited;
  }

  const prereqGroups = new Map();

  validLinks.forEach(l => {

    const target = l.target;
    const source = l.source;
    const group = l.group ?? 0;

    if (!prereqGroups.has(target)) prereqGroups.set(target, new Map());
    const targetGroups = prereqGroups.get(target);

    if (!targetGroups.has(group)) targetGroups.set(group, []);
    targetGroups.get(group).push(source);

  });

  //finds the prerequisites and the unlocked lessons
  function findRelevantCourses(focusId) {
    const prereqs = traverse(focusId, reverse);
    const dependents = traverse(focusId, forward);
    const relevant = new Set([...prereqs, ...dependents]);
    return { prereqs, dependents, relevant };
  }


  // setting up the D3 simulation
  const nodeSize = 12;
  const nodePadding = 20;

  const simulation = d3.forceSimulation(nodes)
    .alpha(0.7)
    .alphaDecay(0.08)
    .force("link", d3.forceLink(validLinks).id(d => d.id).distance(190))
    .force("charge", d3.forceManyBody().strength(-320))
    .force("x", d3.forceX(d => d.xTarget).strength(0.008))
    .force("collide", d3.forceCollide(nodeSize + nodePadding));


  // creating the svg elements
  const link = svg.append("g")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.7)
    .selectAll("line")
    .data(validLinks)
    .enter()
    .append("line")
    .attr("stroke-dasharray", d => (d.type === "OR" ? "6 6" : null));

  const node = svg.append("g")
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("r", nodeSize)
    .attr("fill", "#ffffff")
    .attr("stroke", "#000")
    .attr("stroke-width", 1);

  const label = svg.append("g")
    .selectAll("text.node-label")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "node-label")
    .attr("text-anchor", "start")
    .attr("dx", 12)
    .attr("dy", "0.35em")
    .style("font-size", "14px")
    .style("pointer-events", "none")
    .text(d => d.id);

  const dragSelectionLayer = svg.append("g");

  const dragSelectionBox = dragSelectionLayer.append("rect")
    .attr("display", "none")
    .attr("fill", "rgba(59, 130, 246, 0.18)")
    .attr("stroke", "#2563eb")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4 4")
    .style("pointer-events", "none");

  let dragSelection = false;
  let selectionBegins = null;
  let movedSelection = false;

  const detailsPanel = document.getElementById("course-details-panel");
  const detailsContent = document.getElementById("course-details-content");
  const detailsClose = document.getElementById("close-course-details");


  // ui state functions

  // converts the dropdown value into a number
  function turnYearToNum(selectEl) {

    if (!selectEl) return null;
    const val = String(selectEl.value || "").trim();

    if (val === "all") return null;
    if (/^\d+$/.test(val)) return Number(val);

    const txt = String(selectEl.options?.[selectEl.selectedIndex]?.text || "").trim();

    if (txt.includes("έτος")) {
      const m = txt.match(/^(\d+)/);
      return m ? Number(m[1]) : null;
    }

    return null;
  }

  // checks if the lesson goes through the year filter
  function passesYear(n, ui) {
    if (!ui.yearLimit) return true;
    return n.year <= ui.yearLimit;
  }

  // checks if the lesson is offered this year
  function passesOffered(n, ui) {
    if (!ui.offeredOnly) return true;
    return !!n.offered;
  }

  // clears category ids, normalization for comparisons
  function normalizeCatId(catId) {

    let c = String(catId || "").trim().toUpperCase();
    c = c.replace(/\s+/g, "");
    return c;
  }

  // checks the category filters
  function passesCategory(n, ui) {
    const c = normalizeCatId(n.cat_id);

    if (c === "K" || c === "Κ") return ui.catK;
    if (c === "ΒΚ-Π" || c === "BK-P" || c === "BK-Π") return ui.catBKP;
    if (c === "ΒΚ-Τ" || c === "BK-T" || c === "BK-Τ") return ui.catBKT;
    if (c === "ΕΚ-Π" || c === "EK-P" || c === "EK-Π") return ui.catEKP;
    if (c === "ΕΚ-Τ" || c === "EK-T" || c === "EK-Τ") return ui.catEKT;
    if (c === "ΕΚ-ΠΤ" || c === "EK-PT" || c === "EK-ΠΤ") return ui.catEKPT;
    if (c === "ΕΕ" || c === "EE") return ui.catEE;
    if (c === "ΠΔ") return ui.catPD;

    return true;
  }

  // combines the filters
  function passesAllFilters(d, ui) {
    return passesYear(d, ui) && passesOffered(d, ui) && passesCategory(d, ui);
  }

  // convinient searching 
  function simpleSearchText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[\s\-_.]/g, "");
  } 

  //reads the current filters and modes from DOM
  function getUIState() {

    const yearEl = document.getElementById("year");
    const yearLimit = turnYearToNum(yearEl);

    const modeEl = document.querySelector("input[name='interaction-mode']:checked");
    const interactionMode = modeEl ? modeEl.value : "focus";

    return {
      yearLimit,
      offeredOnly: document.getElementById("offered-only")?.checked ?? false,
      interactionMode,

      catK: document.getElementById("cat-k")?.checked ?? true,
      catBKP: document.getElementById("cat-bk-p")?.checked ?? true,
      catBKT: document.getElementById("cat-bk-t")?.checked ?? true,
      catEKP: document.getElementById("cat-ek-p")?.checked ?? true,
      catEKT: document.getElementById("cat-ek-t")?.checked ?? true,
      catEKPT: document.getElementById("cat-ek-pt")?.checked ?? true,
      catEE: document.getElementById("cat-ee")?.checked ?? true,
      catPD: document.getElementById("cat-pd")?.checked ?? true,
    };
  }

  //updates the visual (node colors and visibility)
  function applyVisuals() {
    const ui = getUIState();
    giveModeHelp();

    const hasFocus =
      ui.interactionMode === "focus" &&
      !!currentFocusId &&
      nodeWithId.has(currentFocusId);

    const focusSets = hasFocus ? findRelevantCourses(currentFocusId) : null;

    node.style("display", d => (passesAllFilters(d, ui) ? null : "none"));
    label.style("display", d => (passesAllFilters(d, ui) ? null : "none"));

    if (!hasFocus) {
      node
        .attr("opacity", 1)
        .attr("fill", d => {
          if (passedCourses.has(d.id)) return "#3b82f6";
          if (passedCourses.size > 0 && checkCourseAvailable(d.id)) return "#22c55e";
          if (passedCourses.size > 0) return "#ef4444";
          return "#ffffff";
        })
        .attr("stroke", d => {
          if (passedCourses.has(d.id)) return "#1d4ed8";
          if (passedCourses.size > 0 && checkCourseAvailable(d.id)) return "#166534";
          if (passedCourses.size > 0) return "#991b1b";
          return "#000";
        })
        .attr("stroke-width", d => {
          if (passedCourses.has(d.id)) return 2;
          if (passedCourses.size > 0) return 2;
          return 1;
        });

      label.attr("opacity", 1);
    } else {
      node
        .attr("opacity", d => (focusSets.relevant.has(d.id) ? 1 : 0.22))
        .attr("fill", d => {
          if (d.id === currentFocusId) return "#2679ff";
          if (focusSets.prereqs.has(d.id)) return "#b6d0fa";
          if (focusSets.dependents.has(d.id)) return "#002d75";
          return "#e5e7eb";
        })
        .attr("stroke", d => {
          if (d.id === currentFocusId) return "#125cd4";
          if (focusSets.prereqs.has(d.id)) return "#5683cc";
          if (focusSets.dependents.has(d.id)) return "#000e25";
          return "#9ca3af";
        })
        .attr("stroke-width", d => (d.id === currentFocusId ? 3 : 1));

      label.attr("opacity", d => (focusSets.relevant.has(d.id) ? 1 : 0.22));
    }

    link.style("display", l => {
      const s = (typeof l.source === "object") ? l.source.id : l.source;
      const t = (typeof l.target === "object") ? l.target.id : l.target;
      const sn = nodeWithId.get(s);
      const tn = nodeWithId.get(t);

      if (!sn || !tn) return "none";
      return (passesAllFilters(sn, ui) && passesAllFilters(tn, ui)) ? null : "none";
    });

    link.attr("opacity", l => {
      if (!hasFocus) return 1;

      const s = (typeof l.source === "object") ? l.source.id : l.source;
      const t = (typeof l.target === "object") ? l.target.id : l.target;
      const bothRelevant = focusSets.relevant.has(s) && focusSets.relevant.has(t);

      return bothRelevant ? 0.85 : 0.12;
    });
  }

  //info icon explanations for modes
  function giveModeHelp() {
    const help = document.getElementById("mode-help-block");
    if (!help) return;

    const ui = getUIState();

    if (ui.interactionMode === "passed") {
      help.innerHTML = `
          <label>Planning mode</label>
            <div class="legend">
              <div class="legend-row">
                <span class="legend-dot legend-planning-passed"></span>
                <span>Περασμένο μάθημα</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot legend-planning-available"></span>
                <span>Μπορεί να δηλωθεί</span>
              </div>
              <div class="legend-row">
                <span class="legend-dot legend-planning-unavailable"></span>
                <span>Δεν μπορεί να δηλωθεί ακόμα</span>
              </div>
            </div>

            <div class="passed-area">
              <button type="button" id="clear-passed" class="clear-icon-button" title="Καθαρισμός περασμένων">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M3 6h18"></path>
                  <path d="M8 6V4h8v2"></path>
                  <path d="M6 6l1 14h10l1-14"></path>
                  <path d="M10 11v6"></path>
                  <path d="M14 11v6"></path>
                </svg>
              </button>

              <div id="passed-list" class="passed-list"></div>
            </div>
          `;
      giveTagsPassedCourses();

      const clearPassedBtn = document.getElementById("clear-passed");
      if (clearPassedBtn) {
        clearPassedBtn.onclick = () => {
          passedCourses.clear();
          saveFocus();
          giveTagsPassedCourses();
          applyVisuals();
        };
      }
    } else {
      help.innerHTML = `
        <label>Focus mode</label>
        <div class="legend">
          <div class="legend-row">
            <span class="legend-dot legend-focus-prereq"></span>
            <span>Προαπαιτούμενα</span>
          </div>
          <div class="legend-row">
            <span class="legend-dot legend-focus-selected"></span>
            <span>Επιλεγμένο μάθημα</span>
          </div>
          <div class="legend-row">
            <span class="legend-dot legend-focus-unlocks"></span>
            <span>Μαθήματα που ξεκλειδώνει</span>
          </div>
        </div>
      `;
    }
  }


  // additional focus mode functions

  // sets a new focus lesson and updates the visual
  function applyFocus(focusId) {
    if (!nodeWithId.has(focusId)) return;
    currentFocusId = focusId;
    saveFocus();
    applyVisuals();
  }

  // finds the selected focus lesson
  function clearFocus() {
    currentFocusId = null;
    saveFocus();
    applyVisuals();
  }


  // planning mode functions

  // save the current focus and the passed lessons on the window
  function checkCourseAvailable(courseId) {
    if (passedCourses.has(courseId)) return false;

    const groups = prereqGroups.get(courseId);

    if (!groups || groups.size === 0) return true;

    for (const reqList of groups.values()) {
      const groupSatisfied = reqList.some(reqId => passedCourses.has(reqId));
      if (!groupSatisfied) return false;
    }

    return true;
  }

  const passedCourses = new Set(window.__passedCourses || []);
  let currentFocusId = window.__currentFocusId || null;

  // checks eligibility and if the prerequisites have been passed
  function saveFocus() {
    window.__passedCourses = Array.from(passedCourses);
    window.__currentFocusId = currentFocusId;
  }

  // tags for the passed lessons
  function giveTagsPassedCourses() {
    const passedListEl = document.getElementById("passed-list");
    if (!passedListEl) return;

    passedListEl.innerHTML = "";

    if (passedCourses.size === 0) {
      passedListEl.innerHTML = '<div class="helper-text">Δεν έχουν επιλεγεί περασμένα μαθήματα.</div>';
      return;
    }

    [...passedCourses].sort().forEach(id => {
      const tag = document.createElement("button");
      tag.type = "button";
      tag.className = "passed-tag";
      tag.textContent = `${id} ✕`;
      tag.onclick = () => {
        passedCourses.delete(id);
        saveFocus();
        giveTagsPassedCourses();
        applyVisuals();
      };
      passedListEl.appendChild(tag);
    });
  }

  // adds or removes passed lessons and updates the ui 
  function adjustPassedCourse(courseId) {
    if (passedCourses.has(courseId)) passedCourses.delete(courseId);
    else passedCourses.add(courseId);

    saveFocus();
    giveTagsPassedCourses();
    applyVisuals();
  }


  // drag selection functions for planning mode

  //gets the mouse position
  function getPointerPosition(event) {
    return d3.pointer(event, svg.node());
  }

 // activates the selection
  function startSelection(event) {
    const ui = getUIState();
    if (ui.interactionMode !== "passed") return;
    if (event.target.tagName === "circle") return;

    dragSelection = true;
    movedSelection = false;
    selectionBegins = getPointerPosition(event);

    dragSelectionBox
      .attr("display", null)
      .attr("x", selectionBegins[0])
      .attr("y", selectionBegins[1])
      .attr("width", 0)
      .attr("height", 0);
  }

  //updates the selection while dragging
  function updateSelection(event) {
    if (!dragSelection) return;

    movedSelection = true;
    const [x, y] = getPointerPosition(event);

    const rectX = Math.min(selectionBegins[0], x);
    const rectY = Math.min(selectionBegins[1], y);
    const rectW = Math.abs(x - selectionBegins[0]);
    const rectH = Math.abs(y - selectionBegins[1]);

    dragSelectionBox
      .attr("x", rectX)
      .attr("y", rectY)
      .attr("width", rectW)
      .attr("height", rectH);
  }

  //completes the selection
  function completeSelection(event) {
    if (!dragSelection) return;

    const ui = getUIState();
    const [x, y] = getPointerPosition(event);

    const rectX = Math.min(selectionBegins[0], x);
    const rectY = Math.min(selectionBegins[1], y);
    const rectW = Math.abs(x - selectionBegins[0]);
    const rectH = Math.abs(y - selectionBegins[1]);

    dragSelectionBox.attr("display", "none");

    if (movedSelection && rectW > 4 && rectH > 4) {
      nodes.forEach(d => {
        if (!passesAllFilters(d, ui)) return;

        if (
          d.x >= rectX &&
          d.x <= rectX + rectW &&
          d.y >= rectY &&
          d.y <= rectY + rectH
        ) {
          passedCourses.add(d.id);
        }
      });

      saveFocus();
      giveTagsPassedCourses();
      applyVisuals();
    }

    dragSelection = false;
    selectionBegins = null;
    movedSelection = false;
  }


  // details panel functions

  // converts the category id to a readable label
  function categoryLabelText(catId) {

    const c = normalizeCatId(catId);

    if (c === "K" || c === "Κ") return "Κορμού";
    if (c === "ΒΚ-Π" || c === "BK-P" || c === "BK-Π") return "Βασικά Κατεύθυνσης Πληροφορικής";
    if (c === "ΒΚ-Τ" || c === "BK-T" || c === "BK-Τ") return "Βασικά Κατεύθυνσης Τηλεπικοινωνιών";
    if (c === "ΒΚ-ΠΤ" || c === "BK-PT" || c === "BK-ΠΤ") return "Βασικά Κατεύθυνσης Πληροφορικής-Τηλεπικοινωνιών";
    if (c === "ΕΚ-Π" || c === "EK-P" || c === "EK-Π") return "Επιλογής Κατεύθυνσης Πληροφορικής";
    if (c === "ΕΚ-Τ" || c === "EK-T" || c === "EK-Τ") return "Επιλογής Κατεύθυνσης Τηλεπικοινωνιών";
    if (c === "ΕΚ-ΠΤ" || c === "EK-PT" || c === "EK-ΠΤ") return "Επιλογής Κατεύθυνσης Πληροφορικής-Τηλεπικοινωνιών";
    if (c === "ΕΕ" || c === "EE") return "Ελεύθερης Επιλογής";
    if (c === "ΠΔ") return "Παιδαγωγικά";

    return c || "Άγνωστη κατηγορία";
  }

  // fills in the details panel
  function getCourseDetails(course) {
    if (!detailsPanel || !detailsContent || !course) return;

    const year = Math.ceil(course.semester / 2);

    detailsContent.innerHTML = `
      <div class="course-detail-row"><span class="course-detail-label">Κωδικός:</span> ${course.id}</div>
      <div class="course-detail-row"><span class="course-detail-label">Τίτλος:</span> ${course.label || "-"}</div>
      <div class="course-detail-row"><span class="course-detail-label">Εξάμηνο:</span> ${course.semester ?? "-"}</div>
      <div class="course-detail-row"><span class="course-detail-label">Έτος:</span> ${year}ο</div>
      <div class="course-detail-row"><span class="course-detail-label">Κατηγορία:</span> ${categoryLabelText(course.cat_id)}</div>
      <div class="course-detail-row"><span class="course-detail-label">Προσφέρεται φέτος:</span> ${course.offered ? "Ναι" : "Όχι"}</div>
      <div class="course-detail-row"><span class="course-detail-label">Διδάσκων:</span> ${course.teachers ? course.teachers : "Δεν έχει ανατεθεί"}</div>
    `;

    detailsPanel.classList.remove("hidden");
  }

  // hiddes the details panel
  function closeDetailsPanel() {
    if (!detailsPanel) return;
    detailsPanel.classList.add("hidden");
  }


  //event listeners
  node.on("click", (event, d) => {
    event.stopPropagation();

    const ui = getUIState();

    if (ui.interactionMode === "passed") {
      adjustPassedCourse(d.id);
      return;
    }

    if (ui.interactionMode === "focus") {
      applyFocus(d.id);
      return;
    }
  });

  node.on("dblclick", (event, d) => {
    event.stopPropagation();
    getCourseDetails(d);
  });

  svg.on("mousedown", startSelection);
  svg.on("mousemove", updateSelection);
  svg.on("mouseup", completeSelection);
  svg.on("mouseleave", completeSelection);

  svg.on("click", () => {
    const ui = getUIState();

    if (ui.interactionMode === "passed") return;
    if (movedSelection) return;
    if (ui.interactionMode !== "focus") return;

    const searchEl = document.getElementById("search");
    if (searchEl) searchEl.value = "";
    clearFocus();
  });

  const searchEl = document.getElementById("search");
    if (searchEl) {
      searchEl.oninput = () => {

        const rawQuery = searchEl.value.trim();
        const q = simpleSearchText(rawQuery);
        const ui = getUIState();

        if (!q) {
          clearFocus();
          return;
        }

        let searchFound = nodes.find(n => simpleSearchText(n.id) === q);

        if (!searchFound) {
          searchFound = nodes.find(n => simpleSearchText(n.id).startsWith(q));
        }

        if (!searchFound) {
          searchFound = nodes.find(n => simpleSearchText(n.label).startsWith(q));
        }

        if (!searchFound) {
          searchFound = nodes.find(n => simpleSearchText(n.id).includes(q));
        }

        if (!searchFound) {
          searchFound = nodes.find(n => simpleSearchText(n.label).includes(q));
        }

        if (ui.interactionMode === "focus") {
          if (searchFound) applyFocus(searchFound.id);
          else clearFocus();
        }
      };
    }

  document.querySelectorAll(".sidebar input, .sidebar select").forEach(el => {
    el.onchange = applyVisuals;
  });

  document.querySelectorAll(".accordion-header").forEach(header => {
    header.onclick = () => {
      const item = header.closest(".accordion-item");
      if (!item) return;
      item.classList.toggle("open");
    };
  });

  if (detailsClose) {
    detailsClose.onclick = closeDetailsPanel;
  }


  // simulation tick
  simulation.on("tick", () => {
    nodes.forEach(d => {
      d.x = Math.max(220, Math.min(width - 260, d.x));
    });

    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", d => d.x)
      .attr("cy", d => d.y);

    label
      .attr("x", d => d.x)
      .attr("y", d => d.y);

    if (simulation.alpha() < 0.03) simulation.stop();
  });

 //initial render functions
  giveModeHelp();
  giveTagsPassedCourses();
  applyVisuals();

  //tooltip interactions
  const tooltipBox = document.getElementById("tooltip-box");

  document.querySelectorAll(".info-icon").forEach(icon => {

    icon.onmouseenter = () => {
      const html = icon.getAttribute("data-tooltip-html");
      if (!html || !tooltipBox) return;

      tooltipBox.innerHTML = html;
      tooltipBox.style.display = "block";
    };

    icon.onmousemove = (e) => {
      if (!tooltipBox) return;
      tooltipBox.style.left = (e.clientX + 15) + "px";
      tooltipBox.style.top = (e.clientY + 15) + "px";
    };

    icon.onmouseleave = () => {
      if (!tooltipBox) return;
      tooltipBox.style.display = "none";
    };
  });

}