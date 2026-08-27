/* SSC 2027 — Form Logic + GSAP + Lenis + Enhanced Interactions */
(function(){
"use strict";

/* ============================================
   SUPABASE — insert-only anon client
   ============================================ */
var SUPABASE_URL=window.SUPABASE_URL||"";
var SUPABASE_ANON_KEY=window.SUPABASE_ANON_KEY||"";
var supabase=(typeof window!=="undefined"&&window.supabase&&SUPABASE_URL&&SUPABASE_ANON_KEY)?window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;

/* Form field name -> registrations column */
var FIELD_MAP={
  email:"email",
  fullName:"full_name",
  contact:"contact_number",
  faculty:"faculty_institute",
  programme:"programme_course",
  semester:"current_semester_year",
  division:"division_batch",
  github:"github_profile",
  linkedin:"linkedin_profile",
  github_profile:"github_profile",
  linkedin_profile:"linkedin_profile",
  portfolio:"portfolio_website",
  hasUniEmail:"has_uni_email",
  uniEmail:"uni_email",
  enrollmentId:"uni_enrollment_id",
  personalEmail:"personal_email",
  studentStatus:"student_status",
  enrollmentNumber:"enrollment_number",
  macAccess:"mac_access",
  deviceFrequency:"device_frequency",
  needMacLab:"needs_mac_lab",
  prepHours:"hours_per_week_prep",
  appExperience:"app_experience",
  appleExperience:"apple_experience",
  independence:"independence_confidence",
  interests:"interests_improving",
  prevCompetitions:"previous_competitions",
  competitionDetails:"competition_details",
  commitmentLevel:"commitment_level",
  programHours:"hours_per_week_program",
  workSchedule:"work_schedule",
  attendSessions:"willing_to_attend",
  whyInterested:"why_interested",
  hasIdea:"has_idea",
  ideaDescription:"idea_description",
  excitement:"excitement_level",
  buildInterest:"build_interest",
  confirmAccuracy:"confirm_accurate",
  noGuarantee:"understand_no_guarantee",
  agreeContact:"agree_contact",
  anythingElse:"anything_else"
};
var BOOL_COLS=["has_uni_email","previous_competitions","confirm_accurate","understand_no_guarantee","agree_contact"];
var ARRAY_COLS=["interests_improving","work_schedule","excitement_level","build_interest"];

function buildRegistrationRow(){
  var fd=new FormData(form),raw={};
  fd.forEach(function(v,k){
    if(raw[k]!==undefined){
      if(Array.isArray(raw[k]))raw[k].push(v);
      else raw[k]=[raw[k],v];
    }else raw[k]=v;
  });
  var row={};
  Object.keys(FIELD_MAP).forEach(function(f){
    if(raw[f]===undefined)return;
    var col=FIELD_MAP[f],val=raw[f];
    if(ARRAY_COLS.indexOf(col)>=0)val=Array.isArray(val)?val:[val];
    else if(BOOL_COLS.indexOf(col)>=0)val=(val==="Yes");
    row[col]=val;
  });
  return row;
}

var TOTAL_PAGES=9,currentPage=1,lenis=null;
var heroSection=document.getElementById("heroSection");
var formSection=document.getElementById("formSection");
var showcaseSection=document.getElementById("showcaseSection");
var prevBtn=document.getElementById("prevBtn");
var nextBtn=document.getElementById("nextBtn");
var submitBtn=document.getElementById("submitBtn");
var progressFill=document.getElementById("progressFill");
var progressStep=document.getElementById("progressStep");
var progressPercent=document.getElementById("progressPercent");
var successMessage=document.getElementById("successMessage");
var form=document.getElementById("registrationForm");
var pages=document.querySelectorAll(".form-page");

var pageValidation={
  1:["email"],
  2:["fullName","contact","faculty","programme","semester","hasUniEmail"],
  3:["uniEmail","enrollmentId"],
  4:["personalEmail","studentStatus","enrollmentNumber"],
  5:["macAccess","needMacLab","prepHours"],
  6:["appExperience","appleExperience","independence","prevCompetitions"],
  7:["commitmentLevel","programHours","attendSessions"],
  8:["whyInterested","hasIdea"],
  9:["confirmAccuracy","noGuarantee","agreeContact"]
};

/* ============================================
   LENIS SMOOTH SCROLL
   ============================================ */
function initLenis(){
  if(typeof Lenis==="undefined")return;
  lenis=new Lenis({duration:1.2,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true});
  /* keep ScrollTrigger perfectly in sync with Lenis' smoothed scroll */
  if(typeof ScrollTrigger!=="undefined")lenis.on("scroll",ScrollTrigger.update);
  function raf(time){lenis.raf(time);requestAnimationFrame(raf)}
  requestAnimationFrame(raf);
}

/* ============================================
   GSAP ANIMATIONS
   ============================================ */
function initGSAP(){
  if(typeof gsap==="undefined")return;
  if(typeof ScrollTrigger!=="undefined")gsap.registerPlugin(ScrollTrigger);

  /* Hero entrance — staggered reveal (landing page only) */
  if(heroSection){
    var heroTl=gsap.timeline({delay:0.3});
    heroTl.fromTo(".site-header",{opacity:0,y:-20},{opacity:1,y:0,duration:0.6,ease:"power2.out"});
    heroTl.fromTo(heroSection.querySelector(".swift-logo"),{opacity:0,scale:0.5,rotation:-10},{opacity:1,scale:1,rotation:0,duration:0.7,ease:"back.out(1.7)"},"-=0.3");
    heroTl.fromTo(".hero-eyebrow",{opacity:0,y:15},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
    heroTl.fromTo(".hero-title",{opacity:0,y:25},{opacity:1,y:0,duration:0.6,ease:"power3.out"},"-=0.2");
    heroTl.fromTo(".hero-desc",{opacity:0,y:20},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
  }

  /* Guideline cards — scroll-triggered reveal. initGuidelinesScatter owns
     BOTH layouts via gsap.matchMedia(), so crossing the breakpoint in either
     direction swaps between the scattered collage and the plain stagger
     without ever needing a reload. */
  if(typeof ScrollTrigger!=="undefined"){
    gsap.fromTo(".guidelines-head",{opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:"power3.out",scrollTrigger:{trigger:"#guidelinesSection",start:"top 80%",once:true}});
    initGuidelinesScatter();
  }
}

/* ============================================
   GUIDELINES SCATTER — desktop / Mac / PC only.
   The panels keep their order and content, but each one
   gets a resting pose (lateral offset + tilt), settles in
   with a scroll-triggered entrance, drifts at its own speed
   while the section scrolls through the viewport (scrubbed
   parallax à la Codrops' scattered galleries), and wobbles
   gently at idle. Transform/opacity only — GPU-cheap.
   gsap.matchMedia() reverts everything below 1100px.
   ============================================ */
function initGuidelinesScatter(){
  var mm=gsap.matchMedia();
  mm.add({
    desktop:"(min-width:1100px) and (hover:hover) and (pointer:fine)",
    wide:"(min-width:1900px) and (hover:hover) and (pointer:fine)",
    motion:"(prefers-reduced-motion: no-preference)"
  },function(ctx){
    /* off-layout (mobile / touch / narrow / reduced-motion): cheap stagger
       reveal, transforms cleared afterwards so nothing lingers */
    if(!ctx.conditions.desktop||!ctx.conditions.motion){
      gsap.fromTo(".guideline-card",{opacity:0,y:36},{opacity:1,y:0,duration:0.6,ease:"power3.out",stagger:0.12,clearProps:"opacity,transform",scrollTrigger:{trigger:".guidelines-list",start:"top 82%",once:true}});
      return;
    }

    /* ultra-wide displays get a proportionally wider scatter;
       normal laptops keep the composed look */
    var k=ctx.conditions.wide?1.7:1;

    var list=document.querySelector(".guidelines-list");
    var cards=gsap.utils.toArray(".guideline-card");
    if(!list||!cards.length)return;

    /* [xOffset px, tilt deg, drift px] — hand-tuned per card so the
       collage feels composed, not random */
    var poses=[
      {x:-26,r:-1.3,p: 70},
      {x: 30,r: 1.6,p:-55},
      {x:-18,r: 1.0,p:-80},
      {x: 22,r:-1.8,p: 60},
      {x:-30,r:-0.9,p:-65},
      {x: 16,r: 1.3,p: 85},
      {x:-12,r:-1.5,p:-50}
    ];

    var baseX=cards.map(function(c,i){return poses[i%poses.length].x*k});
    var maxAbsX=Math.max.apply(null,baseX.map(Math.abs));

    /* never let the scatter clip a panel against the viewport edge:
       measure the free space beside the grid and shrink the offsets
       proportionally if the display is tight (iMac scaling etc.) */
    function fitScatterX(){
      var lr=list.getBoundingClientRect();
      var slack=Math.max(0,Math.min(lr.left,window.innerWidth-lr.right));
      var f=slack+maxAbsX>0?Math.min(1,slack/(maxAbsX+12)):0;
      cards.forEach(function(c,i){gsap.set(c,{x:baseX[i]*f})});
    }

    cards.forEach(function(card,i){
      var p=poses[i%poses.length];

      /* resting scatter pose */
      gsap.set(card,{x:p.x*k,rotation:p.r});
      /* entrance — rises in while settling from a stronger tilt */
      gsap.from(card,{autoAlpha:0,rotation:p.r*2.2,scale:0.96,duration:0.9,ease:"power3.out",
        scrollTrigger:{trigger:card,start:"top 88%",once:true}});

      /* scrubbed drift — each panel floats at its own speed & direction */
      gsap.fromTo(card,{y:-p.p*k/2},{y:p.p*k/2,ease:"none",
        scrollTrigger:{trigger:list,start:"top bottom",end:"bottom top",scrub:true}});

      /* idle liquid wobble — rotation composes with the drift */
      gsap.to(card,{rotation:p.r+(i%2?0.7:-0.7),duration:2.8+(i%4)*0.45,yoyo:true,repeat:-1,ease:"sine.inOut"});
    });

    /* ---- the thread: an ember line that joins the panels,
            drawn by scroll, with a pulse running along it ---- */
    var applyBtn=document.getElementById("showcaseBeginBtn");
    var SVG_NS="http://www.w3.org/2000/svg";
    var svg=document.createElementNS(SVG_NS,"svg");
    svg.setAttribute("class","guide-thread");
    svg.setAttribute("aria-hidden","true");
    svg.innerHTML=
      '<defs><linearGradient id="threadGrad" x1="0" y1="0" x2="1" y2="1">'+
        '<stop offset="0%" stop-color="rgba(240,81,35,0)"/>'+
        '<stop offset="12%" stop-color="rgba(240,81,35,0.55)"/>'+
        '<stop offset="50%" stop-color="rgba(255,243,216,0.75)"/>'+
        '<stop offset="88%" stop-color="rgba(240,81,35,0.55)"/>'+
        '<stop offset="100%" stop-color="rgba(240,81,35,0.55)"/>'+
      '</linearGradient></defs>'+
      '<path id="threadBase" fill="none" stroke="url(#threadGrad)" stroke-width="1.5" stroke-linecap="round"/>';
    list.insertBefore(svg,list.firstChild);
    var basePath=svg.querySelector("#threadBase");

    var tailTip=null;
    var buildAttempts=0,buildQueued=false,cancelled=false,ro=null;

    /* coalesce every rebuild trigger (resize, fonts, RO, load) into one rAF */
    function scheduleBuild(){
      if(cancelled||buildQueued)return;
      buildQueued=true;
      requestAnimationFrame(function(){buildQueued=false;buildThread()});
    }

    function threadD(){
      var lr=list.getBoundingClientRect();
      var pts=cards.map(function(c){
        var r=c.getBoundingClientRect();
        return{
          /* subtract the live parallax drift so the path anchors to the
             panel's resting pose, not wherever it currently floated */
          x:r.left+r.width/2-lr.left,
          y:r.top+r.height/2-lr.top-gsap.getProperty(c,"y")
        };
      });
      /* smooth S-weave through every panel centre */
      var d="M "+pts[0].x+" "+pts[0].y;
      for(var i=1;i<pts.length;i++){
        var my=(pts[i-1].y+pts[i].y)/2;
        d+=" C "+pts[i-1].x+" "+my+", "+pts[i].x+" "+my+", "+pts[i].x+" "+pts[i].y;
      }
      /* signature tail — ONE sweeping curve off the last panel, rising
         over to hover above the Apply button. The droplet falls from
         the tip onto the button. */
      var last=pts[pts.length-1];
      var lr=list.getBoundingClientRect();
      var ctaSec=document.getElementById("applyCtaSection");
      var cr=ctaSec?ctaSec.getBoundingClientRect():null;
      var tX=cr?cr.left+cr.width/2-lr.left:(br?br.left+br.width/2-lr.left:last.x+60*k);
      var tY=cr?cr.top-lr.top+20:(br?(br.top-lr.top+25):(lr.bottom-lr.top)+160);
      if(tY<last.y+50)tY=last.y+50;
      /* dip down out of the panel, sweep across, settle pointing down
         just above the button */
      d+=" C "+(last.x)+" "+(last.y+150*k)+", "+tX+" "+(tY-130*k)+", "+tX+" "+tY;
      return{d:d,tail:{x:tX,y:tY}};
    }

    function buildThread(){
      if(cancelled)return;
      try{
        fitScatterX();
        var w=Math.max(1,list.offsetWidth),h=Math.max(1,list.offsetHeight);
        svg.setAttribute("viewBox","0 0 "+w+" "+h);
        svg.setAttribute("preserveAspectRatio","none");
        var td=threadD();
        basePath.setAttribute("d",td.d);
        tailTip=td.tail;

        buildAttempts=0;
      }catch(err){
        /* transient layout state (fonts swapping, grid not sized yet) —
           bounded retries instead of silently dying */
        if(buildAttempts++<6)setTimeout(buildThread,150*buildAttempts);
      }
    }

    /* ---- pulse hand-off: fly a spark from the thread's tail into the
          Apply button; the button ignites liquid-gold for 1.5s ---- */
    var emberCore=null,litT=null,sparkTween=null;

    if(applyBtn){
      emberCore=document.createElement("span");
      emberCore.className="btn-ember-core";
      applyBtn.appendChild(emberCore);
      var ripple=document.createElement("span");
      ripple.className="btn-ripple";
      applyBtn.appendChild(ripple);
      var sheen=document.createElement("span");
      sheen.className="btn-sheen";
      applyBtn.appendChild(sheen);
    }

    function igniteButton(){
      if(!applyBtn)return;
      applyBtn.classList.remove("apply-lit");
      void applyBtn.offsetWidth; /* restart CSS animation */
      applyBtn.classList.add("apply-lit");
      clearTimeout(litT);
      litT=setTimeout(function(){applyBtn.classList.remove("apply-lit")},1500);
    }

    function launchSpark(){
      if(!tailTip||!applyBtn||document.hidden)return;
      var lr=list.getBoundingClientRect();
      var br=applyBtn.getBoundingClientRect();
      var sx=lr.left+tailTip.x,sy=lr.top+tailTip.y;
      var tx=br.left+br.width/2,ty=br.top+br.height/2;
      /* off-screen hand-off looks broken — skip this lap */
      if(sy<-200||sy>window.innerHeight+300||ty<0||ty>window.innerHeight)return;

      var orb=document.createElement("div");
      orb.className="spark-orb";
      document.body.appendChild(orb);
      gsap.set(orb,{x:sx,y:sy});

      /* fluid droplet: sways out of the thread tip, stretches as it
         accelerates, wobbles like liquid metal, lands soft */
      var cx=sx+(Math.random()*46-23);
      var cy=(sy+ty)/2;
      var dist=Math.max(30,Math.abs(ty-sy));
      var dur=Math.min(0.95,0.5+dist/900);
      var o={t:0};
      if(sparkTween)sparkTween.kill();
      sparkTween=gsap.timeline({onComplete:function(){
        orb.remove();
        igniteButton();
      }});
      sparkTween.to(o,{t:1,duration:dur,ease:"power1.in",
        onUpdate:function(){
          var t=o.t,mt=1-t;
          gsap.set(orb,{
            x:mt*mt*sx+2*mt*t*cx+t*t*tx,
            y:mt*mt*sy+2*mt*t*cy+t*t*ty
          });
        }},0);
      /* elongates with velocity… */
      sparkTween.to(orb,{scaleY:1.45,scaleX:.82,duration:dur*0.45,ease:"power1.in"},0);
      sparkTween.to(orb,{rotation:9,duration:dur*0.55,yoyo:true,repeat:1,ease:"sine.inOut"},0);
      /* …then gets absorbed into the button: shrinks & fades to nothing
         right as it touches the surface */
      sparkTween.to(orb,{scaleX:.1,scaleY:.26,opacity:0,duration:dur*0.32,ease:"power2.in"},dur*0.68);
    }

    buildThread();
    window.addEventListener("load",scheduleBuild);
    window.addEventListener("resize",scheduleBuild);
    window.addEventListener("orientationchange",scheduleBuild);
    /* late font swaps change every card's height — rebuild when they land */
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){scheduleBuild()});
    /* ResizeObserver catches ANY layout shift that changes the list or a
       card (font swap, zoom, devtools open, dynamic content) — this is the
       safety net that made the thread flaky before */
    if(typeof ResizeObserver!=="undefined"){
      ro=new ResizeObserver(function(){scheduleBuild()});
      ro.observe(list);
      cards.forEach(function(c){ro.observe(c)});
    }

    return function(){ /* revert when the media query stops matching */
      cancelled=true;
      cards.forEach(function(c){gsap.killTweensOf(c)});
      if(ro){ro.disconnect();ro=null}
      if(drawTween){drawTween.scrollTrigger&&drawTween.scrollTrigger.kill();drawTween.kill()}
      if(pulseTween)pulseTween.kill();
      if(sparkTween)sparkTween.kill();
      clearTimeout(litT);
      if(applyBtn)applyBtn.classList.remove("apply-lit");
      if(emberCore)emberCore.remove();
      document.querySelectorAll(".btn-ripple,.btn-sheen,.spark-orb").forEach(function(o){o.remove()});
      window.removeEventListener("load",scheduleBuild);
      window.removeEventListener("resize",scheduleBuild);
      window.removeEventListener("orientationchange",scheduleBuild);
      svg.remove();
      gsap.set(cards,{clearProps:"transform,opacity,visibility"});
    };
  });
}

/* ============================================
   TILT EFFECT
   ============================================ */
function initTilt(){
  document.querySelectorAll("[data-tilt]").forEach(function(card){
    card.addEventListener("mousemove",function(e){
      var rect=card.getBoundingClientRect();
      var x=(e.clientX-rect.left)/rect.width-0.5;
      var y=(e.clientY-rect.top)/rect.height-0.5;
      card.style.transform="perspective(800px) rotateX("+(-y*2.5)+"deg) rotateY("+(x*2.5)+"deg) scale(1.005)";
    });
    card.addEventListener("mouseleave",function(){
      card.style.transform="perspective(800px) rotateX(0) rotateY(0) scale(1)";
      card.style.transition="transform 0.5s cubic-bezier(0.4,0,0.2,1)";
      setTimeout(function(){card.style.transition=""},500);
    });
  });
}

/* ============================================
   MAGNETIC BUTTON
   Proximity-based displacement + spring snap-back
   ============================================ */
function initMagneticButtons(){
  var magneticEls=document.querySelectorAll(".cta-btn,.submit-btn");
  magneticEls.forEach(function(btn){
    var strength=0.3;
    btn.addEventListener("mousemove",function(e){
      var rect=btn.getBoundingClientRect();
      var x=e.clientX-rect.left-rect.width/2;
      var y=e.clientY-rect.top-rect.height/2;
      btn.style.transform="translate("+(x*strength)+"px,"+(y*strength)+"px)";
      btn.classList.add("magnetic-active");
    });
    btn.addEventListener("mouseleave",function(){
      btn.style.transform="translate(0,0)";
      btn.style.transition="transform .4s cubic-bezier(.34,1.56,.64,1)";
      btn.classList.remove("magnetic-active");
      setTimeout(function(){btn.style.transition=""},400);
    });
  });
}

/* ============================================
   TOUCH RIPPLE EFFECT
   Material-style ripple on tap for mobile
   ============================================ */
function initTouchRipple(){
  var rippleEls=document.querySelectorAll(".custom-radio,.custom-checkbox,.nav-btn,.cta-btn");
  rippleEls.forEach(function(el){
    el.style.position="relative";
    el.style.overflow="hidden";
    el.addEventListener("click",function(e){
      var rect=el.getBoundingClientRect();
      var ripple=document.createElement("span");
      var size=Math.max(rect.width,rect.height);
      ripple.style.cssText="position:absolute;border-radius:50%;pointer-events:none;width:"+size+"px;height:"+size+"px;left:"+(e.clientX-rect.left-size/2)+"px;top:"+(e.clientY-rect.top-size/2)+"px;background:rgba(240,81,35,0.12);transform:scale(0);animation:rippleEffect .5s ease-out forwards";
      el.appendChild(ripple);
      setTimeout(function(){ripple.remove()},600);
    });
  });

  /* Inject ripple keyframes */
  if(!document.getElementById("rippleStyle")){
    var style=document.createElement("style");
    style.id="rippleStyle";
    style.textContent="@keyframes rippleEffect{to{transform:scale(3);opacity:0}}";
    document.head.appendChild(style);
  }
}

/* ============================================
   TOAST NOTIFICATION SYSTEM
   ============================================ */
var toastContainer=null;
function initToastContainer(){
  if(!toastContainer){
    toastContainer=document.createElement("div");
    toastContainer.className="toast-container";
    document.body.appendChild(toastContainer);
  }
}

function showToast(message,type){
  initToastContainer();
  var toast=document.createElement("div");
  toast.className="toast";
  var iconClass=type==="error"?"error":"success";
  var iconSvg=type==="error"
    ?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    :'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>';
  toast.innerHTML='<span class="toast-icon '+iconClass+'">'+iconSvg+'</span><span>'+message+'</span>';
  toastContainer.appendChild(toast);

  setTimeout(function(){
    toast.classList.add("toast-out");
    setTimeout(function(){toast.remove()},350);
  },3500);
}

/* ============================================
   FIELD VALIDATION
   ============================================ */
function validateField(name){
  var isValid=true,errorMsg="";
  var radios=form.querySelectorAll("[name=\""+name+"\"]");
  var isRadio=radios.length>0&&radios[0].type==="radio";
  var input=form.querySelector("[name=\""+name+"\"]");
  var fieldGroup=input?input.closest(".field-group"):null;
  if(!fieldGroup&&isRadio&&radios[0])fieldGroup=radios[0].closest(".field-group");
  var errorEl=fieldGroup?fieldGroup.querySelector(".field-error"):null;

  if(input&&input.type!=="radio"){
    if(input.required&&!input.value.trim()){isValid=false;errorMsg="This field is required"}
    else if(input.type==="email"&&input.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)){isValid=false;errorMsg="Please enter a valid email"}
    else if(input.type==="url"&&input.value&&!/^https?:\/\/.+/.test(input.value)){isValid=false;errorMsg="Please enter a valid URL"}
  }
  if(isRadio){
    var checked=form.querySelector("[name=\""+name+"\"]:checked");
    if(radios[0].required&&!checked){isValid=false;errorMsg="Please select an option"}
  }
  if(!isValid){
    if(errorEl){errorEl.textContent=errorMsg;errorEl.classList.add("visible")}
    if(fieldGroup)fieldGroup.classList.add("has-error");
    if(input&&input.type!=="radio")input.classList.add("error");
    if(isRadio){var rg=radios[0].closest(".radio-group");if(rg)rg.classList.add("error")}
    showToast(errorMsg,"error");
  }else{
    if(errorEl){errorEl.textContent="";errorEl.classList.remove("visible")}
    if(fieldGroup)fieldGroup.classList.remove("has-error");
    if(input)input.classList.remove("error");
    if(isRadio){var rg2=radios[0].closest(".radio-group");if(rg2)rg2.classList.remove("error")}
  }
  return isValid;
}

function clearValidation(){
  form.querySelectorAll(".field-error").forEach(function(el){el.textContent="";el.classList.remove("visible")});
  form.querySelectorAll(".has-error").forEach(function(el){el.classList.remove("has-error")});
  form.querySelectorAll(".error").forEach(function(el){el.classList.remove("error")});
  form.querySelectorAll(".radio-group.error").forEach(function(el){el.classList.remove("error")});
}

function validatePage(num){
  var fields=pageValidation[num]||[];
  var allValid=true;
  fields.forEach(function(name){if(!validateField(name))allValid=false});
  return allValid;
}

/* ============================================
   PROGRESS BAR
   ============================================ */
function updateProgress(){
  var pct=Math.round((currentPage/TOTAL_PAGES)*100);
  progressFill.style.width=pct+"%";
  progressStep.textContent="Step "+currentPage+" of "+TOTAL_PAGES;
  progressPercent.textContent=pct+"%";
}

/* ============================================
   PAGE NAVIGATION with stagger animation
   ============================================ */
function goToPage(num){
  if(num<1||num>TOTAL_PAGES)return;
  clearValidation();

  /* CSS .active handles a lightweight, GPU-cheap entrance — no per-field
     JS animation, so navigation stays smooth on low-end mobile devices. */
  pages.forEach(function(p){p.classList.remove("active")});
  pages[num-1].classList.add("active");
  currentPage=num;
  updateProgress();
  saveProgress();
  prevBtn.disabled=currentPage===1;
  if(currentPage===TOTAL_PAGES){
    nextBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
  }else{
    nextBtn.classList.remove("hidden");
    submitBtn.classList.add("hidden");
  }
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ============================================
   PROGRESS AUTOSAVE — Google-Forms-style resume.
   Persists every answer + current step to
   localStorage (wrapped in try/catch so Safari
   private mode and blocked storage never crash).
   ============================================ */
var STORAGE_KEY="ssc2027_form_progress";

function storageAvailable(){
  try{
    var t="__ssc_probe__";
    localStorage.setItem(t,t);
    localStorage.removeItem(t);
    return true;
  }catch(e){return false}
}

function saveProgress(){
  if(!storageAvailable())return;
  try{
    var fd=new FormData(form),data={};
    fd.forEach(function(v,k){
      if(data[k]!==undefined){
        if(Array.isArray(data[k]))data[k].push(v);
        else data[k]=[data[k],v];
      }else data[k]=v;
    });
    localStorage.setItem(STORAGE_KEY,JSON.stringify({page:currentPage,data:data}));
  }catch(e){}
}

function clearProgress(){
  try{localStorage.removeItem(STORAGE_KEY)}catch(e){}
}

function restoreProgress(){
  var saved=null;
  try{saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||"null")}catch(e){}
  if(!saved||!saved.data)return null;
  Object.keys(saved.data).forEach(function(k){
    var vals=[];
    (Array.isArray(saved.data[k])?saved.data[k]:[saved.data[k]]).forEach(function(v){vals.push(String(v))});
    var fields=form.querySelectorAll('[name="'+k+'"]');
    if(!fields.length)return;
    if(fields[0].type==="radio"){
      var val=vals[0];
      var match=form.querySelector('[name="'+k+'"][value="'+val.replace(/"/g,"&quot;")+'"]');
      if(match){
        match.checked=true;
      }else{
        /* value was a custom "Other" write-in */
        var other=form.querySelector('[name="'+k+'"][value="Other"]');
        if(other){
          other.checked=true;
          var writein=other.closest(".radio-group").querySelector(".other-writein");
          if(writein){writein.classList.remove("hidden");writein.value=val}
          other.value=val;
        }
      }
    }else if(fields[0].type==="checkbox"){
      fields.forEach(function(c){c.checked=vals.indexOf(c.value)>=0});
    }else{
      fields[0].value=vals[0];
    }
  });
  return saved.page;
}

/* ============================================
   FORM SUBMISSION
   ============================================ */
/* ---- Event Listeners ----
   (guarded: app.js is shared by the landing page, where the form doesn't exist) */
if(prevBtn)prevBtn.addEventListener("click",function(){goToPage(currentPage-1)});
if(nextBtn)nextBtn.addEventListener("click",function(){
  if(validatePage(currentPage)){
    showToast("Progress saved","success");
    goToPage(currentPage+1);
  }
});

if(form)form.addEventListener("submit",function(e){
  e.preventDefault();
  if(!validatePage(currentPage))return;
  if(!supabase){
    showToast("Submission service is unavailable. Please try again later.","error");
    return;
  }
  submitBtn.disabled=true;
  var original=submitBtn.textContent;
  submitBtn.textContent="Submitting…";
  var row=buildRegistrationRow();
  supabase.from("registrations").insert([row],{returning:"minimal"}).then(function(res){
    if(res.error)throw res.error;
    showSuccess(row.email);
    sendConfirmation(row.email,row.full_name);
  }).catch(function(err){
    console.error("Supabase insert failed:",err);
    showToast("Submission failed: "+(err&&err.message?err.message:"please try again"),"error");
    submitBtn.disabled=false;
    submitBtn.textContent=original;
  });
});

function showSuccess(email){
  clearProgress();
  var emailEl=document.getElementById("successEmail");
  if(emailEl)emailEl.textContent=email||"";
  form.classList.add("hidden");
  document.querySelector(".progress-wrapper").classList.add("hidden");
  successMessage.classList.remove("hidden");
  if(typeof gsap!=="undefined"){
    var successTl=gsap.timeline();
    successTl.fromTo(successMessage.querySelector(".success-card"),{opacity:0,y:30,scale:0.97},{opacity:1,y:0,scale:1,duration:0.6,ease:"power3.out"});
    successTl.fromTo(successMessage.querySelector(".swift-logo"),{opacity:0,scale:0.5,rotation:-15},{opacity:1,scale:1,rotation:0,duration:0.5,ease:"back.out(1.7)"},"-=0.3");
    successTl.fromTo(".success-title",{opacity:0,y:15},{opacity:1,y:0,duration:0.4,ease:"power2.out"},"-=0.2");
    successTl.fromTo(".success-desc",{opacity:0,y:12},{opacity:1,y:0,duration:0.4,ease:"power2.out"},"-=0.15");
  }
  showToast("Application submitted successfully!","success");
}

/* Fire-and-forget confirmation email (serverless /api/confirm) */
function sendConfirmation(email,name){
  if(!email)return;
  fetch("/api/confirm",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:email,name:name||""})
  }).catch(function(e){
    console.warn("Confirmation email was not sent:",e);
  });
}

/* live validation on change */
if(form)form.querySelectorAll("input,textarea").forEach(function(el){
  el.addEventListener("change",function(){
    if(el.closest(".field-group")&&el.closest(".field-group").classList.contains("has-error")){
      validateField(el.name);
    }
  });
  el.addEventListener("input",function(){
    if(el.classList.contains("error"))validateField(el.name);
  });
});

/* "Other" write-in: reveal when Other is selected, sync typed value into the radio */
if(form)form.querySelectorAll('input[type="radio"][value="Other"]').forEach(function(radio){
  var group=radio.closest(".radio-group");
  var writein=group?group.querySelector(".other-writein"):null;
  if(!writein)return;
  radio.addEventListener("change",function(){
    if(radio.checked){
      writein.classList.remove("hidden");
      if(writein.value.trim())radio.value=writein.value.trim();
    }else{
      writein.classList.add("hidden");
      radio.value="Other";
    }
  });
  writein.addEventListener("input",function(){
    radio.value=writein.value.trim()?writein.value.trim():"Other";
  });
});

/* ============================================
   3D PARALLAX DEVICE SHOWCASE
   Mouse-tracked perspective on device stage
   ============================================ */
function initDeviceParallax(){
  var stage=document.getElementById("devicesStage");
  if(!stage)return;
  var devices=stage.querySelectorAll(".device-float");
  var rafPending=false,lastX=0,lastY=0;

  /* If GSAP isn't available, leave the CSS transforms alone (centering still works). */
  if(typeof gsap==="undefined")return;

  var isMobile=function(){return window.matchMedia("(max-width:768px)").matches;};
  var macScale=function(){return isMobile()?0.65:0.8;};

  /* Let GSAP own the transforms so centering + intro + parallax never fight. */
  gsap.set(".device-iphone",{xPercent:-50,yPercent:-50,rotationY:-6,rotationX:3});
  gsap.set(".device-macbook",{xPercent:-50,yPercent:-50,rotationY:10,rotationX:-2,scale:macScale()});

  var introDone=false;

  /* Scroll-triggered reveal */
  if(typeof ScrollTrigger!=="undefined"){
    gsap.registerPlugin(ScrollTrigger);
    var tl=gsap.timeline({scrollTrigger:{trigger:stage,start:"top 80%",once:true},onComplete:function(){introDone=true;}});
    tl.fromTo(".showcase-eyebrow",{opacity:0,y:20},{opacity:1,y:0,duration:0.5,ease:"power2.out"});
    tl.fromTo(".showcase-title",{opacity:0,y:25},{opacity:1,y:0,duration:0.6,ease:"power3.out"},"-=0.3");
    tl.fromTo(".showcase-desc",{opacity:0,y:18},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
    tl.fromTo(".device-iphone",{opacity:0,y:60,rotationY:-15},{opacity:1,y:0,rotationY:-6,duration:0.8,ease:"power3.out"},"-=0.3");
    tl.fromTo(".device-macbook",{opacity:0,y:50,rotationY:20},{opacity:1,y:0,rotationY:10,duration:0.8,ease:"power3.out"},"-=0.6");
    tl.fromTo(".device-swift",{opacity:0,scale:0},{opacity:1,scale:1,duration:0.5,ease:"back.out(1.7)"},"-=0.4");
    tl.fromTo(".device-badge",{opacity:0,y:-20},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
  } else {
    introDone=true;
  }

  function applyParallax(x,y){
    if(!introDone)return; /* don't fight the reveal animation */
    devices.forEach(function(dev){
      var speed=parseFloat(dev.dataset.speed)||1;
      var rY=x*12*speed, rX=-y*8*speed, tX=x*15*speed, tY=y*12*speed;
      if(dev.classList.contains("device-iphone")){
        gsap.to(dev,{rotationY:rY-6,rotationX:rX+3,x:tX,y:tY,duration:0.5,ease:"power2.out",overwrite:"auto"});
      }else if(dev.classList.contains("device-macbook")){
        gsap.to(dev,{rotationY:rY+10,rotationX:rX-2,x:tX,y:tY,duration:0.5,ease:"power2.out",overwrite:"auto"});
      }
      /* swift + badge keep their CSS float animation */
    });
  }

  stage.addEventListener("mousemove",function(e){
    var rect=stage.getBoundingClientRect();
    lastX=(e.clientX-rect.left)/rect.width-0.5;
    lastY=(e.clientY-rect.top)/rect.height-0.5;
    if(rafPending)return;
    rafPending=true;
    requestAnimationFrame(function(){applyParallax(lastX,lastY);rafPending=false;});
  });

  stage.addEventListener("mouseleave",function(){
    if(!introDone)return;
    gsap.to(".device-iphone",{rotationY:-6,rotationX:3,x:0,y:0,duration:0.6,ease:"power2.out",overwrite:"auto"});
    gsap.to(".device-macbook",{rotationY:10,rotationX:-2,x:0,y:0,duration:0.6,ease:"power2.out",overwrite:"auto"});
  });

  /* Keep mac scale correct across breakpoints */
  window.addEventListener("resize",function(){
    gsap.set(".device-macbook",{scale:macScale()});
  });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener("DOMContentLoaded",function(){
  /* Lenis smooth-scroll and the mouse-driven parallax are desktop-only.
     On touch / low-end devices they either misbehave (Lenis) or just burn
     frames for no benefit, so we fall back to native scroll + no parallax. */
  var canHover = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(canHover) initLenis();
  initGSAP();
  initTilt();
  initMagneticButtons();
  initTouchRipple();
  initToastContainer();
  if(canHover) initDeviceParallax();
  /* On the apply page the form is visible immediately — restore any
     previously saved progress (Google-Forms-style resume) and jump to
     the step the user left off at. */
  if(formSection&&!formSection.classList.contains("hidden")){
    var savedPage=restoreProgress();
    goToPage(savedPage&&savedPage>=1&&savedPage<=TOTAL_PAGES?savedPage:1);
  }else if(progressFill){
    updateProgress();
  }
});
})();
