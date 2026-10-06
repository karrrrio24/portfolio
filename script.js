(function () {
  "use strict";

  const data = window.PORTFOLIO_DATA;
  if (!data) return;

  const featuredList = document.querySelector("#featured-list");
  const archiveGroups = document.querySelector("#archive-groups");
  const rippleIndex = document.querySelector("#ripple-index");
  const rippleStage = document.querySelector("#ripple-stage");
  const rippleCoordinate = document.querySelector(".ripple-coordinate");
  const dialog = document.querySelector("#project-dialog");
  const dialogContent = document.querySelector("#dialog-content");
  const dialogCounter = document.querySelector("#dialog-counter");
  const closeButton = dialog.querySelector(".dialog-close");
  const currentYear = document.querySelector("#current-year");
  const scrollProgress = document.querySelector(".scroll-rail-line i");
  const scrollPercent = document.querySelector(".scroll-rail-percent");
  const scrollLabel = document.querySelector(".scroll-rail-label");
  const hero = document.querySelector(".hero");
  const heroTitle = document.querySelector(".hero-title");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const compactMedia = window.matchMedia("(max-width: 620px)").matches;
  const workMap = new Map(data.works.map((work) => [work.id, work]));
  const featuredWorks = data.works.filter((work) => work.featured);
  const scrambleTimers = new WeakMap();
  const carouselTimers = new WeakMap();
  let returnFocusTo = null;
  let dialogMediaObserver = null;

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const numberLabel = (value) => String(value).padStart(2, "0");

  const mobileImagePath = (src = "") =>
    src.startsWith("assets/images-web/")
      ? src.replace("assets/images-web/", "assets/images-mobile/")
      : "";

  const preferredImagePath = (src = "") =>
    compactMedia && mobileImagePath(src) ? mobileImagePath(src) : src;

  const mobileVideoSources = new Map([
    ["assets/video/post-shadow-play.mp4", "assets/video/mobile/post-shadow-play-mobile.mp4"],
    ["https://karrrrio24.github.io/portfolio/assets/video/desensitization-chongqing-latest.mp4", "assets/video/mobile/desensitization-mobile.mp4"],
    ["assets/video/weiqu-south-web.mp4", "assets/video/mobile/weiqu-south-mobile.mp4"],
  ]);

  const buildAsciiField = (seed, width = 68, height = 24) => {
    const tones = " .·:░▒▓█";
    let state = seed * 104729 + 17;
    const random = () => {
      state = (state * 16807) % 2147483647;
      return (state - 1) / 2147483646;
    };
    const rows = [];
    for (let y = 0; y < height; y += 1) {
      let row = "";
      for (let x = 0; x < width; x += 1) {
        const nx = (x / Math.max(1, width - 1)) * 2 - 1;
        const ny = (y / Math.max(1, height - 1)) * 2 - 1;
        const wave = Math.sin((nx * 3.2 + ny * 2.1 + seed) * 2.4) * 0.16;
        const body = 1 - Math.sqrt((nx * (0.86 + seed * 0.018)) ** 2 + (ny * 1.06) ** 2);
        const diagonal = 0.24 - Math.abs(ny - nx * 0.48 + Math.sin(seed) * 0.12);
        const value = Math.max(body + wave, diagonal) + (random() - 0.5) * 0.34;
        const index = Math.max(0, Math.min(tones.length - 1, Math.floor((value + 0.45) * 4.6)));
        row += random() > 0.96 ? String((x + y + seed) % 2) : tones[index];
      }
      rows.push(row);
    }
    return rows.join("\n");
  };

  const buildWorkAscii = (workId, width = 88, height = 34) => {
    const grid = Array.from({ length: height }, () => Array(width).fill(" "));
    const glyphs = "01#@%&*?/\\[]{}<>▓▒░";
    const put = (x, y, weight = 1) => {
      const px = Math.round(x * (width - 1));
      const py = Math.round(y * (height - 1));
      if (px < 0 || px >= width || py < 0 || py >= height) return;
      const key = Math.abs((px * 37 + py * 67 + workId.length * 97) % glyphs.length);
      grid[py][px] = weight > 1 ? "█" : glyphs[key];
    };
    const line = (x1, y1, x2, y2, thickness = 0.012) => {
      const steps = Math.max(width, height) * 2;
      for (let i = 0; i <= steps; i += 1) {
        const t = i / steps;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        put(x, y, 1);
        if (thickness > 0.01) put(x + thickness, y, 1);
      }
    };
    const box = (x1, y1, x2, y2) => {
      line(x1, y1, x2, y1); line(x2, y1, x2, y2); line(x2, y2, x1, y2); line(x1, y2, x1, y1);
    };
    const ellipse = (cx, cy, rx, ry, filled = false) => {
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const dx = (x / (width - 1) - cx) / rx;
          const dy = (y / (height - 1) - cy) / ry;
          const d = dx * dx + dy * dy;
          if ((filled && d <= 1) || (!filled && d >= 0.79 && d <= 1.12)) put(x / (width - 1), y / (height - 1), d > 0.92 ? 2 : 1);
        }
      }
    };

    if (workId === "work-introduction") {
      box(0.18, 0.12, 0.82, 0.68);
      box(0.22, 0.17, 0.78, 0.62);
      [0.28, 0.37, 0.46, 0.55].forEach((y, index) => line(0.28, y, index % 2 ? 0.69 : 0.73, y));
      line(0.34, 0.68, 0.30, 0.92, 0.02); line(0.66, 0.68, 0.70, 0.92, 0.02); line(0.24, 0.92, 0.76, 0.92);
    } else if (workId === "revelation") {
      line(0.5, 0.92, 0.5, 0.42, 0.02);
      [[0.5,0.46,0.28,0.3],[0.5,0.52,0.72,0.29],[0.5,0.61,0.23,0.5],[0.5,0.7,0.77,0.52],[0.5,0.79,0.35,0.68]].forEach((p) => line(...p));
      [[0.28,0.3],[0.4,0.2],[0.53,0.13],[0.67,0.22],[0.75,0.37],[0.22,0.5],[0.78,0.52]].forEach(([x,y]) => { ellipse(x,y,0.045,0.07,true); line(x,y,x + 0.07,y - 0.04); });
      [0.44,0.56].forEach((x) => line(x,0.92,x,0.82));
    } else if (workId === "body-massage-dj") {
      box(0.1, 0.58, 0.73, 0.78); line(0.14,0.78,0.14,0.92,0.02); line(0.69,0.78,0.69,0.92,0.02);
      ellipse(0.28,0.48,0.055,0.085,true); line(0.33,0.52,0.58,0.63,0.02); line(0.44,0.58,0.4,0.72); line(0.55,0.62,0.63,0.72);
      box(0.77,0.25,0.91,0.77); [0.36,0.47,0.58,0.69].forEach((y) => line(0.8,y,0.88,y));
      ellipse(0.6,0.44,0.04,0.06,true); line(0.6,0.5,0.53,0.61); line(0.6,0.5,0.68,0.61);
    } else if (workId === "shadow-puppet") {
      box(0.43, 0.2, 0.57, 0.83); ellipse(0.5,0.16,0.12,0.1,false); ellipse(0.5,0.35,0.16,0.1,false);
      line(0.43,0.45,0.28,0.34,0.02); line(0.57,0.45,0.72,0.34,0.02); ellipse(0.24,0.32,0.05,0.08,false); ellipse(0.76,0.32,0.05,0.08,false);
      line(0.47,0.83,0.4,0.94,0.02); line(0.53,0.83,0.6,0.94,0.02); line(0.34,0.94,0.66,0.94);
    } else if (workId === "transcendence") {
      // A centered emoji face, drawn only with the garbled-character field.
      ellipse(0.5, 0.48, 0.28, 0.38, false);
      ellipse(0.4, 0.4, 0.035, 0.055, true); ellipse(0.6, 0.4, 0.035, 0.055, true);
      for (let x = 0.38; x <= 0.62; x += 0.012) {
        const y = 0.61 + 0.11 * Math.pow((x - 0.5) / 0.13, 2);
        put(x, y, 1);
      }
      put(0.32,0.55,2); put(0.68,0.55,2); line(0.45,0.51,0.55,0.51);
    } else if (workId === "weiqu-south") {
      // A centered, armless Venus silhouette. The torso and drapery are built from the same glyph field as the background.
      ellipse(0.49, 0.14, 0.065, 0.09, true);
      line(0.47, 0.22, 0.46, 0.28, 0.02); line(0.52, 0.22, 0.53, 0.28, 0.02);
      line(0.46, 0.28, 0.38, 0.34, 0.02); line(0.53, 0.28, 0.61, 0.34, 0.02);
      for (let y = 0.3; y <= 0.57; y += 0.018) {
        const t = (y - 0.3) / 0.27;
        const center = 0.5 + Math.sin(t * Math.PI) * 0.012;
        const halfWidth = 0.115 - Math.sin(t * Math.PI) * 0.038;
        line(center - halfWidth, y, center + halfWidth, y);
      }
      for (let y = 0.55; y <= 0.9; y += 0.018) {
        const t = (y - 0.55) / 0.35;
        const center = 0.5 - t * 0.018;
        const halfWidth = 0.12 + t * 0.09;
        line(center - halfWidth, y, center + halfWidth, y);
        if (Math.round(t * 20) % 3 === 0) line(center - halfWidth * 0.72, y, center + halfWidth * 0.18, y + 0.035);
      }
      line(0.27, 0.92, 0.7, 0.92, 0.02);
    } else {
      ellipse(0.5,0.17,0.07,0.1,true); line(0.48,0.26,0.42,0.55,0.02); line(0.52,0.26,0.58,0.55,0.02);
      ellipse(0.5,0.48,0.16,0.23,true); line(0.42,0.36,0.27,0.58,0.02); line(0.58,0.36,0.73,0.58,0.02);
      line(0.45,0.67,0.39,0.94,0.02); line(0.55,0.67,0.61,0.94,0.02); line(0.33,0.94,0.45,0.94); line(0.55,0.94,0.67,0.94);
    }
    const backgroundGlyphs = "01.:;+-=~/\\[]{}<>";
    const motifGlyphs = "@#%&▓▒█";
    return grid.map((row, y) => row.map((cell, x) => {
      const hash = Math.abs(x * 41 + y * 73 + workId.length * 109);
      if (cell !== " ") return motifGlyphs[hash % motifGlyphs.length];
      return backgroundGlyphs[(hash + x * y) % backgroundGlyphs.length];
    }).join("")).join("\n");
  };

  const buildAsciiDataLayer = (seed, width = 88, height = 34) => {
    const glyphs = "0011..::++xx##@@/\\[]{}<>▓▒░";
    let state = seed * 9187 + 41;
    const random = () => {
      state = (state * 48271) % 2147483647;
      return state / 2147483647;
    };
    return Array.from({ length: height }, (_, y) => {
      const row = Array(width).fill(" ");
      const density = y % 7 === 0 ? 0.98 : 0.9;
      for (let x = 0; x < width; x += 1) {
        if (random() < density) row[x] = glyphs[Math.floor(random() * glyphs.length)];
      }
      if (y % 8 === 2) {
        const tag = `[${String(seed).padStart(2, "0")}:${String(y * 3).padStart(3, "0")}]`;
        const start = Math.max(0, (seed * 13 + y * 5) % Math.max(1, width - tag.length));
        [...tag].forEach((char, index) => { row[start + index] = char; });
      }
      return row.join("");
    }).join("\n");
  };

  const renderAsset = (asset, context = "scene") => {
    if (!asset) return "";
    if (asset.type === "video") {
      const controls = context === "dialog" ? " controls" : "";
      const playback = context === "scene" ? " muted loop playsinline" : " playsinline";
      const mobileVideoSrc = mobileVideoSources.get(asset.src);
      const manualMobilePlayback = Boolean(context === "scene" && compactMedia && mobileVideoSrc);
      const source = `data-src="${escapeHtml(manualMobilePlayback ? mobileVideoSrc : asset.src)}" preload="none"`;
      const manualAttribute = manualMobilePlayback ? " data-manual-play" : "";
      const video = `<video class="project-media" ${source} poster="${escapeHtml(preferredImagePath(asset.poster || ""))}"${playback}${controls}${manualAttribute} aria-label="${escapeHtml(asset.alt)}"></video>`;
      if (context === "dialog") {
        return `${video}<button class="dialog-video-start" type="button" data-video-start aria-label="播放${escapeHtml(asset.alt)}"><span aria-hidden="true">▶</span><small>PLAY</small></button>`;
      }
      if (manualMobilePlayback) {
        return `${video}<button class="scene-video-start" type="button" data-scene-video-start aria-label="点击播放${escapeHtml(asset.alt)}"><span aria-hidden="true">▶</span><small>点击播放 / TAP TO PLAY</small></button>`;
      }
      return video;
    }
    const mobileSrc = mobileImagePath(asset.src);
    return `<img class="project-media" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" data-src="${escapeHtml(asset.src)}"${mobileSrc ? ` data-mobile-src="${escapeHtml(mobileSrc)}"` : ""} alt="${escapeHtml(asset.alt)}"${context === "dialog" ? ' loading="lazy"' : ""} decoding="async" />`;
  };

  const getHomepageAssets = (work) => {
    const allAssets = [work.preview, ...(work.gallery || [])].filter(Boolean);
    const directVideo = allAssets.find((asset) => asset.type === "video");
    const useHomepageVideo = Boolean(directVideo && work.homepageMedia !== "images");
    return useHomepageVideo
      ? [directVideo]
      : allAssets.filter((asset) => asset.type !== "video").slice(0, 10);
  };

  const renderSceneCarousel = (work) => {
    const assets = getHomepageAssets(work);
    const useHomepageVideo = assets.length === 1 && assets[0].type === "video";
    const mediaLabel = useHomepageVideo ? `${work.titleZh} 视频` : `${work.titleZh} 图片轮播`;
    const counter = assets.length > 1 ? `<span class="carousel-count" aria-hidden="true">01 / ${numberLabel(assets.length)}</span>` : "";
    return `<div class="scene-carousel" aria-label="${escapeHtml(mediaLabel)}">${assets.map((asset, index) => {
      const noise = buildAsciiDataLayer((work.order || 1) * 17 + index + 3, 96, 42);
      return `<div class="scene-slide${index === 0 ? " is-current" : ""}" data-orientation="${escapeHtml(asset.orientation || "landscape")}" aria-hidden="${index === 0 ? "false" : "true"}"><div class="media-noise-fill" aria-hidden="true"><pre>${noise}</pre></div>${renderAsset(asset, "scene")}</div>`;
    }).join("")}</div>${counter}`;
  };

  const renderGallery = (work) => {
    const assets = [work.preview, ...(work.gallery || [])]
      .filter(Boolean)
      .map((asset, index) => ({ asset, index }))
      .sort((a, b) => Number(b.asset.type === "video") - Number(a.asset.type === "video") || a.index - b.index)
      .map(({ asset }) => asset);
    const workSeed = Math.max(1, data.works.indexOf(work) + 1);
    const layoutClass = work.galleryLayout
      ? ` detail-gallery-${escapeHtml(work.galleryLayout)}`
      : "";
    const archiveClass = work.featured ? "" : " detail-gallery-archive";
    const compactClass = !work.featured && !work.imagesOnly ? " detail-gallery-compact" : "";
    return `<div class="detail-gallery${layoutClass}${archiveClass}${compactClass}" data-count="${assets.length}">${assets.map((asset, index) => `
      <figure class="detail-gallery-item${work.featured && index === 0 ? " detail-gallery-lead" : ""}${asset.type === "video" ? " detail-gallery-video" : ""}" data-orientation="${escapeHtml(asset.orientation || "landscape")}">
        <div class="media-noise-fill detail-noise-fill" aria-hidden="true"><pre>${buildAsciiDataLayer(workSeed * 23 + index + 5, 96, 42)}</pre></div>
        ${renderAsset(asset, "dialog")}
        <figcaption>${numberLabel(index + 1)} / ${numberLabel(assets.length)}</figcaption>
      </figure>`).join("")}</div>`;
  };

  const renderFeatured = () => {
    featuredList.innerHTML = featuredWorks.map((work) => {
      const alias = work.aliases.length
        ? `<p class="work-alias">后续阶段 / LATER TITLE<br />${escapeHtml(work.aliases.join(" · "))}</p>`
        : `<p class="work-alias">${escapeHtml(work.roleZh)}<br />${escapeHtml(work.roleEn)}</p>`;
      const homepageAssets = getHomepageAssets(work);
      const carouselControl = homepageAssets.length > 1
        ? ` role="button" tabindex="0" data-carousel-control aria-label="切换《${escapeHtml(work.titleZh)}》的下一张图片"`
        : "";
      const homepageVideo = homepageAssets.length === 1 && homepageAssets[0].type === "video";
      const mediaMode = homepageAssets.length > 1 ? "AUTO / TAP" : compactMedia && homepageVideo ? "TAP TO PLAY" : "MOVING IMAGE";
      const decodeField = buildWorkAscii(work.id, 88, 34);
      const decodeData = buildAsciiDataLayer(work.order, 88, 34);
      return `
        <article class="work-scene" data-work-id="${escapeHtml(work.id)}" data-transition="${escapeHtml(work.transition || "vertical")}" data-orientation="${escapeHtml(work.preview.orientation || "landscape")}">
          <div class="work-scene-sticky">
            <header class="work-scene-header">
              <span class="work-number">${numberLabel(work.order)}</span>
              <span>${escapeHtml(work.categoryZh)} / ${escapeHtml(work.categoryEn)}</span>
              <span>${escapeHtml(work.year)}</span>
            </header>
            <div class="work-stage">
              <div class="work-visual"${carouselControl}>
                ${renderSceneCarousel(work)}
                <div class="decode-curtain" aria-hidden="true">
                  <div class="decode-ascii-stack">
                    <div class="decode-code-block">
                      <pre class="decode-data">${decodeData}</pre>
                      <pre class="decode-image decode-image-echo">${decodeField}</pre>
                      <pre class="decode-image">${decodeField}</pre>
                      <div class="decode-streams">
                        <span>01://${numberLabel(work.order)} BUFFER ▓▒░ X${numberLabel(work.order * 17)}</span>
                        <span>DATA_${numberLabel(work.order)} [01#@] Y${numberLabel(work.order * 29)}</span>
                        <span>SIGNAL / ${escapeHtml(work.titleEn.toUpperCase())}</span>
                      </div>
                      <span class="decode-cross decode-cross-a">+</span>
                      <span class="decode-cross decode-cross-b">+</span>
                    </div>
                  </div>
                  <div class="decode-readout"><span>IMG_${numberLabel(work.order)} / BUFFER</span><span>X${numberLabel(work.order * 17)} Y${numberLabel(work.order * 29)}</span></div>
                  <p class="decode-title" data-scramble-target="${escapeHtml(work.titleZh)}">▓▒░01#@</p>
                </div>
                <span class="work-media-label" aria-hidden="true">${mediaMode} · ${numberLabel(work.order)}</span>
              </div>
              <div class="work-copy">
                <div class="work-title-wrap">
                  <p class="work-index-label">SELECTED WORK / ${numberLabel(work.order)}</p>
                  <h3 class="work-title" data-title="${escapeHtml(work.titleZh)}">${escapeHtml(work.titleZh)}</h3>
                  <p class="work-title-en" lang="en">${escapeHtml(work.titleEn)}</p>
                </div>
                <div class="receipt-printer">
                  <div class="printer-slot" aria-hidden="true"><span></span></div>
                  <div class="work-receipt">
                    <p class="receipt-mark">YANG CHENXIN / WORK DATA</p>
                    <dl>
                      <div><dt>NO.</dt><dd>${numberLabel(work.order)}</dd></div>
                      <div><dt>YEAR</dt><dd>${escapeHtml(work.year)}</dd></div>
                      <div><dt>MEDIA</dt><dd>${escapeHtml(work.categoryEn)}</dd></div>
                    </dl>
                    <p>${escapeHtml(work.summaryZh)}</p>
                    ${alias}
                    <button class="receipt-open work-trigger" type="button" data-work-id="${escapeHtml(work.id)}" aria-label="查看《${escapeHtml(work.titleZh)}》完整详情">
                      查看完整作品 / OPEN PROJECT <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>`;
    }).join("");
  };

  const renderArchive = () => {
    archiveGroups.innerHTML = data.archiveGroups.map((group) => {
      const linkedProjects = (group.projectLinks || []).map((link) => ({ work: workMap.get(link.workId), link })).filter((item) => item.work);
      const regularWorks = group.workIds.map((id) => workMap.get(id)).filter(Boolean).map((work) => ({ work, link: null }));
      const items = [...linkedProjects, ...regularWorks].map(({ work, link }) => {
        const titleZh = link?.titleZh || work.titleZh;
        const titleEn = link?.titleEn || work.titleEn;
        const categoryZh = link?.categoryZh || work.categoryZh;
        const year = link?.year || work.year;
        const stageTarget = Number.isInteger(link?.stageIndex) ? ` data-stage-index="${link.stageIndex}"` : "";
        const content = `
          <span class="archive-number">${work.featured ? numberLabel(work.order) : "—"}</span>
          <span class="archive-title">${escapeHtml(titleZh)}<span lang="en">${escapeHtml(titleEn)}</span></span>
          <span class="archive-medium">${escapeHtml(categoryZh)}</span>
          <span class="archive-year">${escapeHtml(year)}</span>`;
        return `<li><button class="archive-item archive-trigger work-trigger" type="button" data-work-id="${escapeHtml(work.id)}"${stageTarget} aria-label="查看${escapeHtml(titleZh)}项目详情">${content}</button></li>`;
      }).join("");
      const headingId = `archive-${group.titleEn.toLowerCase().replace(/[^a-z]+/g, "-")}`;
      return `<section class="archive-group" aria-labelledby="${headingId}"><h3 id="${headingId}">${escapeHtml(group.titleZh)}<span lang="en">${escapeHtml(group.titleEn)}</span></h3><ul class="archive-list">${items}</ul></section>`;
    }).join("");
  };

  const ripplePositions = [
    [11, 18], [43, 12], [72, 21], [25, 39], [58, 43], [86, 38],
    [8, 66], [37, 62], [69, 68], [91, 72], [20, 84], [54, 86],
    [80, 89], [48, 28], [15, 51], [78, 54], [33, 76], [62, 16],
  ];

  const renderRippleIndex = () => {
    rippleStage.innerHTML = data.works.slice(0, ripplePositions.length).map((work, index) => {
      const [x, y] = ripplePositions[index];
      const number = numberLabel(index + 1);
      const content = `<span class="ripple-number">${number}</span><span class="ripple-name">${escapeHtml(work.titleZh)}</span><span class="ripple-name-en">${escapeHtml(work.titleEn)}</span>`;
      return `<button class="ripple-title work-trigger" type="button" data-work-id="${escapeHtml(work.id)}" style="--x:${x};--y:${y}" aria-label="${number} 查看《${escapeHtml(work.titleZh)}》">${content}</button>`;
    }).join("");
  };

  const renderStages = (stages = []) => {
    if (!stages.length) return "";
    return `<section class="stage-section" aria-labelledby="stages-title"><h3 id="stages-title">作品阶段 / PROJECT STAGES</h3><ol class="stage-list">${stages.map((stage, index) => `
      <li class="stage-item" data-stage-index="${index}"><span class="stage-year">${escapeHtml(stage.year)}</span><span class="stage-label">${escapeHtml(stage.labelZh)}<br />${escapeHtml(stage.labelEn)}</span><div class="stage-content"><h4>${escapeHtml(stage.title)}</h4><p>${escapeHtml(stage.detailZh)}</p><p lang="en">${escapeHtml(stage.detailEn)}</p></div></li>`).join("")}</ol></section>`;
  };

  const renderDialog = (work) => {
    const alias = (work.aliases || []).length
      ? `<p class="detail-alias">RELATED TITLE / 同一作品后续名称：${escapeHtml(work.aliases.join(" · "))}</p>`
      : "";
    const workNumber = data.works.indexOf(work) + 1;
    dialogCounter.textContent = `${numberLabel(workNumber)} / ${numberLabel(data.works.length)}`;
    const durationMeta = work.duration ? `<div><dt>时长 / DURATION</dt><dd>${escapeHtml(work.duration)}</dd></div>` : "";
    const materialsMeta = work.materialsZh ? `<div><dt>材料 / MATERIALS</dt><dd>${escapeHtml(work.materialsZh)}<br />${escapeHtml(work.materialsEn || "")}</dd></div>` : "";
    const dimensionsMeta = work.dimensions ? `<div><dt>尺寸 / DIMENSIONS</dt><dd>${escapeHtml(work.dimensions)}</dd></div>` : "";
    const displayMeta = work.displayZh ? `<div><dt>展示 / DISPLAY</dt><dd>${escapeHtml(work.displayZh)}<br />${escapeHtml(work.displayEn || "")}</dd></div>` : "";
    const detailBody = work.imagesOnly ? "" : `<section class="detail-body" aria-label="作品信息"><dl class="detail-meta"><div><dt>年份 / YEAR</dt><dd>${escapeHtml(work.year)}</dd></div><div><dt>媒介 / MEDIUM</dt><dd>${escapeHtml(work.categoryZh)}<br />${escapeHtml(work.categoryEn)}</dd></div><div><dt>角色 / ROLE</dt><dd>${escapeHtml(work.roleZh || "待补充")}<br />${escapeHtml(work.roleEn || "Pending")}</dd></div>${materialsMeta}${dimensionsMeta}${displayMeta}${durationMeta}</dl><div class="detail-copy"><p class="detail-lead">${escapeHtml(work.summaryZh || "作品说明待补充。")}</p><p lang="en">${escapeHtml(work.summaryEn || "Project text pending.")}</p></div></section>${renderStages(work.stages || [])}`;
    dialogContent.innerHTML = `
      <article class="detail-project${work.imagesOnly ? " detail-project-images-only" : ""}"><header class="detail-hero"><p class="detail-eyebrow">${escapeHtml(work.categoryZh)} / ${escapeHtml(work.categoryEn)} · ${escapeHtml(work.year)}</p><h2 class="detail-title" id="dialog-title">${escapeHtml(work.titleZh)}</h2><p class="detail-title-en" lang="en">${escapeHtml(work.titleEn)}</p>${alias}</header>
      ${renderGallery(work)}
      ${detailBody}</article>`;
  };

  const setUpDialogMedia = () => {
    if (dialogMediaObserver) dialogMediaObserver.disconnect();
    dialogMediaObserver = null;
    const shell = dialog.querySelector(".dialog-shell");
    const images = [...dialogContent.querySelectorAll("img[data-src]")];
    const loadImage = (image) => {
      if (!image.dataset.src) return;
      image.src = compactMedia && image.dataset.mobileSrc ? image.dataset.mobileSrc : image.dataset.src;
      image.removeAttribute("data-src");
      image.removeAttribute("data-mobile-src");
    };
    if ("IntersectionObserver" in window && shell) {
      dialogMediaObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          loadImage(entry.target);
          observer.unobserve(entry.target);
        });
      }, { root: shell, rootMargin: "0px", threshold: 0.01 });
      images.forEach((image) => dialogMediaObserver.observe(image));
    } else {
      images.forEach(loadImage);
    }

    dialogContent.querySelectorAll("video[data-src]").forEach((video) => {
      const activateVideo = () => {
        if (!video.dataset.src) return;
        video.src = video.dataset.src;
        video.removeAttribute("data-src");
        video.load();
      };
      const startButton = video.parentElement?.querySelector("[data-video-start]");
      video.addEventListener("pointerdown", activateVideo, { once: true });
      video.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") activateVideo();
      });
      if (startButton) {
        startButton.addEventListener("click", () => {
          activateVideo();
          startButton.hidden = true;
          video.play().catch(() => {});
        });
        video.addEventListener("play", () => { startButton.hidden = true; });
      }
    });
  };

  const scrambleText = (element) => {
    if (!element) return;
    const target = element.dataset.scrambleTarget || "";
    const glyphs = "01#@%&*?/\\▓▒░";
    const previous = scrambleTimers.get(element);
    if (previous) window.clearInterval(previous);
    if (reduceMotion) {
      element.textContent = target;
      return;
    }
    let frame = 0;
    const total = 14;
    const timer = window.setInterval(() => {
      element.textContent = [...target].map((char, index) => {
        if (char === " ") return " ";
        if (index / Math.max(target.length, 1) < frame / total) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join("");
      frame += 1;
      if (frame > total) {
        window.clearInterval(timer);
        element.textContent = target;
      }
    }, 34);
    scrambleTimers.set(element, timer);
  };

  const loadSceneSlideMedia = (slide) => {
    if (!slide) return;
    slide.querySelectorAll("img[data-src]").forEach((image) => {
      image.src = compactMedia && image.dataset.mobileSrc ? image.dataset.mobileSrc : image.dataset.src;
      image.removeAttribute("data-src");
      image.removeAttribute("data-mobile-src");
    });
    slide.querySelectorAll("video[data-src]").forEach((video) => {
      if (video.hasAttribute("data-manual-play")) return;
      video.src = video.dataset.src;
      video.removeAttribute("data-src");
      video.load();
    });
  };

  const loadCurrentSceneMedia = (scene) => {
    const slides = [...scene.querySelectorAll(".scene-slide")];
    const currentIndex = slides.findIndex((slide) => slide.classList.contains("is-current"));
    if (currentIndex < 0) return;
    loadSceneSlideMedia(slides[currentIndex]);
    if (scene.classList.contains("is-revealed") && slides.length > 1) {
      loadSceneSlideMedia(slides[(currentIndex + 1) % slides.length]);
    }
  };

  const syncSceneMedia = (scene, shouldPlay = true) => {
    if (shouldPlay) loadCurrentSceneMedia(scene);
    scene.querySelectorAll(".scene-slide").forEach((slide) => {
      const video = slide.querySelector("video");
      if (!video) return;
      if (video.hasAttribute("data-manual-play")) {
        if (!shouldPlay) video.pause();
        return;
      }
      if (slide.classList.contains("is-current") && shouldPlay && scene.classList.contains("is-active") && !reduceMotion) video.play().catch(() => {});
      else video.pause();
    });
  };

  const setCarouselSlide = (scene, nextIndex) => {
    const slides = [...scene.querySelectorAll(".scene-slide")];
    if (slides.length < 2) return;
    const index = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const current = slideIndex === index;
      slide.classList.toggle("is-current", current);
      slide.setAttribute("aria-hidden", String(!current));
    });
    const counter = scene.querySelector(".carousel-count");
    if (counter) counter.textContent = `${numberLabel(index + 1)} / ${numberLabel(slides.length)}`;
    scene.dataset.slideIndex = String(index);
    loadCurrentSceneMedia(scene);
    syncSceneMedia(scene, true);
  };

  const startCarousel = (scene) => {
    if (reduceMotion || scene.querySelectorAll(".scene-slide").length < 2 || carouselTimers.has(scene)) return;
    const timer = window.setInterval(() => {
      const current = Number.parseInt(scene.dataset.slideIndex || "0", 10);
      setCarouselSlide(scene, current + 1);
    }, 3400);
    carouselTimers.set(scene, timer);
  };

  const resetCarousel = (scene) => {
    const timer = carouselTimers.get(scene);
    if (timer) window.clearInterval(timer);
    carouselTimers.delete(scene);
    if (scene.classList.contains("is-revealed")) startCarousel(scene);
  };

  const advanceCarousel = (scene) => {
    const current = Number.parseInt(scene.dataset.slideIndex || "0", 10);
    setCarouselSlide(scene, current + 1);
    resetCarousel(scene);
  };

  const stopCarousel = (scene) => {
    const timer = carouselTimers.get(scene);
    if (timer) window.clearInterval(timer);
    carouselTimers.delete(scene);
    syncSceneMedia(scene, false);
  };

  const setSceneReveal = (scene, reveal) => {
    scene.classList.toggle("is-revealed", reveal);
    if (reveal) {
      loadCurrentSceneMedia(scene);
      scrambleText(scene.querySelector("[data-scramble-target]"));
      syncSceneMedia(scene, true);
      startCarousel(scene);
    } else {
      stopCarousel(scene);
    }
  };

  const openDialog = (workId, trigger, stageIndex = null) => {
    const work = workMap.get(workId);
    if (!work || !work.preview) return;
    returnFocusTo = trigger;
    renderDialog(work);
    const dialogShell = dialog.querySelector(".dialog-shell");
    if (dialogShell) dialogShell.scrollTop = 0;
    document.documentElement.classList.add("modal-open");
    dialog.showModal();
    setUpDialogMedia();
    closeButton.focus();
    if (stageIndex !== null) {
      requestAnimationFrame(() => {
        const targetStage = dialogContent.querySelector(`.stage-item[data-stage-index="${stageIndex}"]`);
        if (targetStage) targetStage.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      });
    }
  };

  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };

  const setUpScenes = () => {
    const scenes = [...document.querySelectorAll(".work-scene")];
    scenes.forEach((scene) => {
      const videoStart = scene.querySelector("[data-scene-video-start]");
      if (videoStart) {
        const video = scene.querySelector("video[data-manual-play]");
        videoStart.addEventListener("click", (event) => {
          event.stopPropagation();
          if (!video) return;
          videoStart.classList.add("is-loading");
          videoStart.setAttribute("aria-busy", "true");
          const label = videoStart.querySelector("small");
          if (label) label.textContent = "加载中 / LOADING";
          if (video.dataset.src) {
            video.src = video.dataset.src;
            video.removeAttribute("data-src");
            video.load();
          }
          video.controls = true;
          video.play().then(() => {
            videoStart.hidden = true;
          }).catch(() => {
            videoStart.classList.remove("is-loading");
            videoStart.removeAttribute("aria-busy");
            if (label) label.textContent = "点击播放 / TAP TO PLAY";
          });
        });
      }
      const carouselControl = scene.querySelector("[data-carousel-control]");
      if (carouselControl) {
        carouselControl.addEventListener("click", () => advanceCarousel(scene));
        carouselControl.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          advanceCarousel(scene);
        });
      }
      scene.addEventListener("pointerenter", () => setSceneReveal(scene, true));
      scene.addEventListener("pointerleave", () => {
        if (finePointer && !scene.matches(":focus-within")) setSceneReveal(scene, false);
      });
      scene.addEventListener("focusin", () => setSceneReveal(scene, true));
      scene.addEventListener("focusout", () => {
        requestAnimationFrame(() => {
          if (!scene.matches(":focus-within") && finePointer) setSceneReveal(scene, false);
        });
      });
    });
    if (!("IntersectionObserver" in window)) {
      scenes.forEach((scene) => {
        scene.classList.add("is-visible", "is-active", "is-revealed");
        loadCurrentSceneMedia(scene);
      });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-visible", entry.isIntersecting);
        if (!entry.isIntersecting) return;
        loadCurrentSceneMedia(entry.target);
      });
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      scenes.forEach((scene) => {
        const isActive = scene === active.target;
        scene.classList.toggle("is-active", isActive);
        if (!finePointer || reduceMotion) setSceneReveal(scene, isActive || reduceMotion);
        if (!isActive) syncSceneMedia(scene, false);
      });
    }, { threshold: [0.12, 0.32, 0.56, 0.78] });
    scenes.forEach((scene) => observer.observe(scene));
  };

  const setUpRipple = () => {
    const titles = [...rippleStage.querySelectorAll(".ripple-title")];
    let lastRipple = 0;
    let activePointer = null;
    let pointerStart = null;
    let suppressClick = false;
    const resetTouchReveal = () => {
      titles.forEach((title, index) => {
        title.style.removeProperty("--proximity");
        title.classList.toggle("is-near", index < 6);
      });
      rippleIndex.classList.remove("is-touching");
    };
    const revealNearby = (clientX, clientY) => {
      const rect = rippleIndex.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      rippleIndex.style.setProperty("--pointer-x", `${px}%`);
      rippleIndex.style.setProperty("--pointer-y", `${py}%`);
      rippleCoordinate.textContent = `X ${String(Math.round(px * 10)).padStart(3, "0")} / Y ${String(Math.round(py * 10)).padStart(3, "0")}`;
      titles.forEach((title) => {
        const tx = Number.parseFloat(title.style.getPropertyValue("--x"));
        const ty = Number.parseFloat(title.style.getPropertyValue("--y"));
        const distance = Math.hypot(px - tx, py - ty);
        const proximity = Math.max(0, Math.min(1, 1 - distance / 28));
        title.style.setProperty("--proximity", proximity.toFixed(3));
        title.classList.toggle("is-near", proximity > 0.22);
      });
      const now = performance.now();
      if (reduceMotion || now - lastRipple < 115) return;
      lastRipple = now;
      const ripple = document.createElement("span");
      ripple.className = "ripple-ring";
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      rippleIndex.append(ripple);
      ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
    };
    rippleIndex.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" && event.pointerId !== activePointer) return;
      if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 9) suppressClick = true;
      revealNearby(event.clientX, event.clientY);
    });
    rippleIndex.addEventListener("pointerdown", (event) => {
      activePointer = event.pointerId;
      pointerStart = { x: event.clientX, y: event.clientY };
      suppressClick = false;
      if (event.pointerType !== "mouse") rippleIndex.classList.add("is-touching");
      revealNearby(event.clientX, event.clientY);
    });
    const endTouch = (event) => {
      if (event.pointerId !== activePointer) return;
      activePointer = null;
      pointerStart = null;
    };
    rippleIndex.addEventListener("pointerup", endTouch);
    rippleIndex.addEventListener("pointercancel", endTouch);
    rippleIndex.addEventListener("click", (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
    rippleIndex.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse" && activePointer === null) resetTouchReveal();
    });
    titles.forEach((title) => title.addEventListener("focus", () => title.classList.add("is-near")));
  };

  const setUpIntro = () => {
    const loaderText = document.querySelector("[data-loader-target]");
    const target = loaderText?.dataset.loaderTarget || "YANG CHENXIN";
    const glyphs = "01#@%&*?/\\[]{}<>▓▒░";
    document.body.classList.add("is-loading");
    if (reduceMotion || !loaderText) {
      if (loaderText) loaderText.textContent = target;
      document.body.classList.add("motion-ready", "is-ready");
      document.body.classList.remove("is-loading");
      return;
    }
    let frame = 0;
    const total = 30;
    const timer = window.setInterval(() => {
      loaderText.textContent = [...target].map((char, index) => {
        if (char === " ") return " ";
        if (index / target.length < Math.max(0, frame - 5) / total) return char;
        return glyphs[Math.floor(Math.random() * glyphs.length)];
      }).join("");
      frame += 1;
      if (frame === 16) document.body.classList.add("loader-locking");
      if (frame > total) {
        window.clearInterval(timer);
        loaderText.textContent = target;
        document.body.classList.add("motion-ready", "is-ready");
        window.setTimeout(() => document.body.classList.remove("is-loading"), 900);
      }
    }, 36);
  };

  const setUpHeroTrail = () => {
    const trail = document.querySelector("#hero-trail");
    if (!trail || reduceMotion || !finePointer) return;
    const images = featuredWorks.map((work) => work.preview?.poster || work.preview?.src).filter(Boolean);
    const glyphs = ["01", "▓▒", "//", "<>_", "#@", "DATA", "?", "[]"];
    let lastPoint = { x: 0, y: 0 };
    let emitted = 0;
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (Math.hypot(x - lastPoint.x, y - lastPoint.y) < 28) return;
      lastPoint = { x, y };
      emitted += 1;
      const fragment = document.createElement("span");
      const isImage = emitted % 6 === 0;
      fragment.className = `trail-fragment ${isImage ? "trail-image" : "trail-glyph"}`;
      fragment.style.left = `${x}px`;
      fragment.style.top = `${y}px`;
      fragment.style.setProperty("--trail-rotate", `${(Math.random() - 0.5) * 18}deg`);
      if (isImage) {
        const image = images[Math.floor(Math.random() * images.length)];
        fragment.style.backgroundImage = `url("${image}")`;
        fragment.style.backgroundPosition = `${Math.round(Math.random() * 100)}% ${Math.round(Math.random() * 100)}%`;
      } else {
        fragment.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      trail.append(fragment);
      window.setTimeout(() => fragment.remove(), isImage ? 900 : 620);
    });
  };

  const setUpContactTrail = () => {
    const section = document.querySelector(".contact-section");
    const trail = document.querySelector("#contact-trail");
    if (!section || !trail || reduceMotion || !finePointer) return;
    const images = featuredWorks.flatMap((work) => [work.preview, ...(work.gallery || [])])
      .filter((asset) => asset?.type === "image")
      .map((asset) => asset.src);
    const glyphs = ["01", "▓▒░", "#@", "<>_", "DATA", "?", "[]", "作品"];
    let lastPoint = { x: 0, y: 0 };
    let emitted = 0;
    section.addEventListener("pointermove", (event) => {
      const rect = section.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (Math.hypot(x - lastPoint.x, y - lastPoint.y) < 34) return;
      lastPoint = { x, y };
      emitted += 1;
      section.style.setProperty("--contact-x", `${(x / rect.width) * 100}%`);
      section.style.setProperty("--contact-y", `${(y / rect.height) * 100}%`);
      const fragment = document.createElement("span");
      const isImage = emitted % 7 === 0;
      fragment.className = `trail-fragment contact-trail-fragment ${isImage ? "trail-image" : "trail-glyph"}`;
      fragment.style.left = `${x}px`;
      fragment.style.top = `${y}px`;
      fragment.style.setProperty("--trail-rotate", `${(Math.random() - 0.5) * 16}deg`);
      if (isImage) {
        fragment.style.backgroundImage = `url("${images[Math.floor(Math.random() * images.length)]}")`;
        fragment.style.backgroundPosition = `${Math.round(Math.random() * 100)}% ${Math.round(Math.random() * 100)}%`;
      } else {
        fragment.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      }
      trail.append(fragment);
      window.setTimeout(() => fragment.remove(), isImage ? 1050 : 720);
    });
    section.addEventListener("pointerleave", () => {
      section.style.setProperty("--contact-x", "50%");
      section.style.setProperty("--contact-y", "50%");
    });
  };

  const setUpMotion = () => {
    setUpIntro();
    const revealTargets = document.querySelectorAll(".scroll-reveal, .archive-group");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.12 });
      revealTargets.forEach((element) => revealObserver.observe(element));
    }
    const sections = [
      [document.querySelector("#top"), "TOP"], [document.querySelector("#works"), "WORKS"],
      [document.querySelector("#archive"), "INDEX"], [document.querySelector("#about"), "ABOUT"],
      [document.querySelector("#contact"), "CONTACT"],
    ].filter(([element]) => element);
    let ticking = false;
    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      scrollProgress.style.transform = `scaleY(${ratio})`;
      scrollPercent.textContent = numberLabel(Math.round(ratio * 100));
      let activeLabel = "TOP";
      sections.forEach(([section, label]) => {
        if (section.getBoundingClientRect().top <= window.innerHeight * 0.45) activeLabel = label;
      });
      scrollLabel.textContent = activeLabel;
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateScroll);
    }, { passive: true });
    updateScroll();
    if (!reduceMotion && hero && heroTitle && finePointer) {
      hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        heroTitle.style.setProperty("--hero-x", `${x * 1.1}rem`);
        heroTitle.style.setProperty("--hero-y", `${y * 0.65}rem`);
        hero.style.setProperty("--field-x", `${(x + 0.5) * 100}%`);
        hero.style.setProperty("--field-y", `${(y + 0.5) * 100}%`);
      });
      hero.addEventListener("pointerleave", () => {
        heroTitle.style.setProperty("--hero-x", "0rem");
        heroTitle.style.setProperty("--hero-y", "0rem");
        hero.style.setProperty("--field-x", "50%");
        hero.style.setProperty("--field-y", "50%");
      });
    }
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(".work-trigger");
    if (trigger) {
      const stageIndex = trigger.dataset.stageIndex === undefined ? null : Number(trigger.dataset.stageIndex);
      openDialog(trigger.dataset.workId, trigger, Number.isInteger(stageIndex) ? stageIndex : null);
    }
  });
  closeButton.addEventListener("click", closeDialog);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.classList.contains("dialog-shell")) closeDialog();
  });
  dialog.addEventListener("close", () => {
    if (dialogMediaObserver) dialogMediaObserver.disconnect();
    dialogMediaObserver = null;
    dialogContent.querySelectorAll("video").forEach((video) => video.pause());
    document.documentElement.classList.remove("modal-open");
    if (returnFocusTo) returnFocusTo.focus();
    returnFocusTo = null;
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog();
  });

  currentYear.textContent = new Date().getFullYear();
  renderFeatured();
  renderArchive();
  renderRippleIndex();
  setUpScenes();
  setUpRipple();
  setUpHeroTrail();
  setUpContactTrail();
  setUpMotion();
})();
