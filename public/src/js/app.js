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
  if (row.enrollment_number && !row.uni_enrollment_id) {
    row.uni_enrollment_id = row.enrollment_number;
  }
  if (!row.personal_email && row.email) {
    row.personal_email = row.email;
  }
  return row;
}

var TOTAL_PAGES=5,currentPage=1,lenis=null;
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
  1:["email","whyInterested","hasIdea"],
  2:["fullName","contact","faculty","programme","semester","hasUniEmail","uniEmail","personalEmail","studentStatus","enrollmentNumber"],
  3:["macAccess","deviceFrequency","prepHours"],
  4:["appExperience","appleExperience","prevCompetitions"],
  5:["commitmentLevel","programHours","attendSessions","confirmAccuracy","noGuarantee","agreeContact"]
};

/* ============================================
   LENIS SMOOTH SCROLL
   ============================================ */
function initLenis(){
  if(typeof Lenis==="undefined")return;
  lenis=new Lenis({duration:1.2,easing:function(t){return Math.min(1,1.001-Math.pow(2,-10*t))},smoothWheel:true});
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

  if(heroSection){
    var heroTl=gsap.timeline({delay:0.3});
    heroTl.fromTo(".site-header",{opacity:0,y:-20},{opacity:1,y:0,duration:0.6,ease:"power2.out"});
    heroTl.fromTo(heroSection.querySelector(".swift-logo"),{opacity:0,scale:0.5,rotation:-10},{opacity:1,scale:1,rotation:0,duration:0.7,ease:"back.out(1.7)"},"-=0.3");
    heroTl.fromTo(".hero-eyebrow",{opacity:0,y:15},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
    heroTl.fromTo(".hero-title",{opacity:0,y:25},{opacity:1,y:0,duration:0.6,ease:"power3.out"},"-=0.2");
    heroTl.fromTo(".hero-desc",{opacity:0,y:20},{opacity:1,y:0,duration:0.5,ease:"power2.out"},"-=0.3");
  }

  if(typeof ScrollTrigger!=="undefined"){
    gsap.fromTo(".guidelines-head",{opacity:0,y:24},{opacity:1,y:0,duration:0.6,ease:"power3.out",scrollTrigger:{trigger:"#guidelinesSection",start:"top 80%",once:true}});
    initGuidelinesScatter();
  }
}

function initGuidelinesScatter(){
  var mm=gsap.matchMedia();
  mm.add({
    desktop:"(min-width:1100px) and (hover:hover) and (pointer:fine)",
    wide:"(min-width:1900px) and (hover:hover) and (pointer:fine)",
    motion:"(prefers-reduced-motion: no-preference)"
  },function(ctx){
    if(!ctx.conditions.desktop||!ctx.conditions.motion){
      gsap.fromTo(".guideline-card",{opacity:0,y:24},{opacity:1,y:0,duration:0.45,ease:"power2.out",stagger:0.06,clearProps:"opacity,transform",scrollTrigger:{trigger:".guidelines-list",start:"top 90%",once:true}});
      return;
    }

    var k=ctx.conditions.wide?1.7:1;
    var list=document.querySelector(".guidelines-list");
    var cards=gsap.utils.toArray(".guideline-card");
    if(!list||!cards.length)return;

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

    function fitScatterX(){
      var lr=list.getBoundingClientRect();
      var slack=Math.max(0,Math.min(lr.left,window.innerWidth-lr.right));
      var f=slack+maxAbsX>0?Math.min(1,slack/(maxAbsX+12)):0;
      cards.forEach(function(c,i){gsap.set(c,{x:baseX[i]*f})});
    }

    cards.forEach(function(card,i){
      var p=poses[i%poses.length];
      gsap.set(card,{x:p.x*k,rotation:p.r});
      gsap.from(card,{autoAlpha:0,rotation:p.r*1.2,scale:0.98,duration:0.5,ease:"power2.out",
        scrollTrigger:{trigger:card,start:"top 95%",once:true}});
      gsap.fromTo(card,{y:-p.p*k/2},{y:p.p*k/2,ease:"none",
        scrollTrigger:{trigger:list,start:"top bottom",end:"bottom top",scrub:true}});
      var yoyoTween=gsap.to(card,{rotation:p.r+(i%2?0.7:-0.7),duration:2.8+(i%4)*0.45,yoyo:true,repeat:-1,ease:"sine.inOut",paused:true});
      ScrollTrigger.create({trigger:list,start:"top bottom",end:"bottom top",onEnter:function(){yoyoTween.play()},onLeave:function(){yoyoTween.pause()},onEnterBack:function(){yoyoTween.play()},onLeaveBack:function(){yoyoTween.pause()}});
    });

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

    var _buildTimer=null;
    function scheduleBuild(){
      if(cancelled)return;
      clearTimeout(_buildTimer);
      _buildTimer=setTimeout(function(){
        if(cancelled||buildQueued)return;
        buildQueued=true;
        requestAnimationFrame(function(){buildQueued=false;buildThread()});
      },150);
    }

    function threadD(){
      var lr=list.getBoundingClientRect();
      var pts=cards.map(function(c){
        var r=c.getBoundingClientRect();
        return{
          x:r.left+r.width/2-lr.left,
          y:r.top+r.height/2-lr.top-gsap.getProperty(c,"y")
        };
      });
      var d="M "+pts[0].x+" "+pts[0].y;
      for(var i=1;i<pts.length;i++){
        var my=(pts[i-1].y+pts[i].y)/2;
        d+=" C "+pts[i-1].x+" "+my+", "+pts[i].x+" "+my+", "+pts[i].x+" "+pts[i].y;
      }
      var last=pts[pts.length-1];
      var lr=list.getBoundingClientRect();
      var br=applyBtn?applyBtn.getBoundingClientRect():null;
      var ctaSec=document.getElementById("applyCtaSection");
      var cr=ctaSec?ctaSec.getBoundingClientRect():null;
      var tX=br?br.left+br.width/2-lr.left:(cr?cr.left+cr.width/2-lr.left:last.x+60*k);
      var tY=br?br.top-lr.top:(cr?cr.top-lr.top+48:(lr.bottom-lr.top)+160);
      if(tY<last.y+50)tY=last.y+50;
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
        if(buildAttempts++<6)setTimeout(buildThread,150*buildAttempts);
      }
    }

    var emberCore=null,litT=null;

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

    buildThread();
    window.addEventListener("load",scheduleBuild);
    window.addEventListener("resize",scheduleBuild);
    window.addEventListener("orientationchange",scheduleBuild);
    if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){scheduleBuild()});
    if(typeof ResizeObserver!=="undefined"){
      ro=new ResizeObserver(function(){scheduleBuild()});
      ro.observe(list);
      cards.forEach(function(c){ro.observe(c)});
    }

    return function(){
      cancelled=true;
      cards.forEach(function(c){gsap.killTweensOf(c)});
      if(ro){ro.disconnect();ro=null}
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
function validateField(name, silent){
  var isValid=true,errorMsg="";
  var radios=form.querySelectorAll("[name=\""+name+"\"]");
  var isRadio=radios.length>0&&radios[0].type==="radio";
  var input=form.querySelector("[name=\""+name+"\"]");
  var fieldGroup=input?input.closest(".field-group"):null;
  if(!fieldGroup&&isRadio&&radios[0])fieldGroup=radios[0].closest(".field-group");
  var errorEl=fieldGroup?fieldGroup.querySelector(".field-error"):null;

  // Skip validation if verification box or field group is hidden
  var verificationBox = document.getElementById("verificationBox");
  if (verificationBox && verificationBox.classList.contains("hidden") && (input && input.closest("#verificationBox") || (isRadio && radios[0] && radios[0].closest("#verificationBox")))) {
    if(errorEl){errorEl.textContent="";errorEl.classList.remove("visible")}
    if(fieldGroup)fieldGroup.classList.remove("has-error");
    if(input)input.classList.remove("error");
    if(isRadio){var rg0=radios[0].closest(".radio-group");if(rg0)rg0.classList.remove("error")}
    return true;
  }

  if (fieldGroup && fieldGroup.classList.contains("hidden")) {
    if(errorEl){errorEl.textContent="";errorEl.classList.remove("visible")}
    if(fieldGroup)fieldGroup.classList.remove("has-error");
    if(input)input.classList.remove("error");
    if(isRadio){var rg3=radios[0].closest(".radio-group");if(rg3)rg3.classList.remove("error")}
    return true;
  }

  if(input&&input.type!=="radio"){
    if(input.required&&!input.value.trim()){isValid=false;errorMsg="This field is required"}
    else if(name==="uniEmail"&&input.value&&!/^[a-zA-Z0-9._%+-]+@paruluniversity\.ac\.in$/i.test(input.value.trim())){
      isValid=false;
      errorMsg="Please enter a valid university email ending with @paruluniversity.ac.in";
    }
    else if((name==="contact")&&input.value&&!/^(\+91[\s-]?)?[6-9][0-9]{9}$/.test(input.value.replace(/\s/g,""))){isValid=false;errorMsg="Please enter a valid 10-digit mobile number"}
    else if(input.type==="email"&&input.value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)){isValid=false;errorMsg="Please enter a valid email address"}
    else if(input.type==="url"&&input.value&&!/^https?:\/\/.+/.test(input.value)){isValid=false;errorMsg="Please enter a valid link (e.g. https://...)"}
    else if((input.type==="number"||name==="semester")&&input.value&&!/^[1-9][0-9]?$/.test(input.value.trim())){isValid=false;errorMsg="Please enter a valid semester number (e.g. 4)"}
  }
  if(isRadio){
    var checked=form.querySelector("[name=\""+name+"\"]:checked");
    if(radios[0].required&&!checked){isValid=false;errorMsg="Please select an option"}
    else if(checked && (checked.value==="Other" || checked.dataset.isOther==="true")){
      var rg=checked.closest(".radio-group");
      var win=rg?rg.querySelector(".other-writein"):null;
      if(win && !win.value.trim()){isValid=false;errorMsg="Please specify your details"}
    }
  }
  if(!isValid){
    if(errorEl){errorEl.textContent=errorMsg;errorEl.classList.add("visible")}
    if(fieldGroup)fieldGroup.classList.add("has-error");
    if(input&&input.type!=="radio")input.classList.add("error");
    if(isRadio){var rg=radios[0].closest(".radio-group");if(rg)rg.classList.add("error")}
    if(!silent) showToast(errorMsg,"error");
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
  fields.forEach(function(name){
    if(!validateField(name, true)) allValid=false;
  });
  if(!allValid){
    showToast("Please complete all required fields correctly to proceed.","error");
  }
  return allValid;
}

// Handle conditional verification fields based on uni email availability
function toggleVerificationFields() {
  var selected = document.querySelector('input[name="hasUniEmail"]:checked');
  var verificationBox = document.getElementById("verificationBox");
  var uniEmailGroup = document.getElementById("uniEmailGroup");
  var personalEmailGroup = document.getElementById("personalEmailGroup");
  var studentStatusGroup = document.getElementById("studentStatusGroup");
  var personalEmailInput = document.getElementById("personalEmail");
  var uniEmailInput = document.getElementById("uniEmail");
  var enrollmentNumberInput = document.getElementById("enrollmentNumber");
  var emailInput = document.getElementById("email");
  var firstStatusRadio = document.querySelector('input[name="studentStatus"]');

  if (!selected) {
    if (verificationBox) verificationBox.classList.add("hidden");
    if (uniEmailInput) uniEmailInput.removeAttribute("required");
    if (personalEmailInput) personalEmailInput.removeAttribute("required");
    if (enrollmentNumberInput) enrollmentNumberInput.removeAttribute("required");
    if (firstStatusRadio) firstStatusRadio.removeAttribute("required");
    return;
  }

  if (verificationBox) verificationBox.classList.remove("hidden");
  if (enrollmentNumberInput) enrollmentNumberInput.setAttribute("required", "required");

  var isParulEmail = emailInput && /^[a-zA-Z0-9._%+-]+@paruluniversity\.ac\.in$/i.test(emailInput.value.trim());

  if (selected.value === "Yes") {
    if (uniEmailGroup) uniEmailGroup.classList.remove("hidden");
    if (uniEmailInput) {
      uniEmailInput.setAttribute("required", "required");
      if (isParulEmail && (!uniEmailInput.value.trim() || /@paruluniversity\.ac\.in$/i.test(uniEmailInput.value.trim()))) {
        uniEmailInput.value = emailInput.value.trim();
        validateField("uniEmail", true);
      }
    }
    if (personalEmailGroup) personalEmailGroup.classList.add("hidden");
    if (studentStatusGroup) studentStatusGroup.classList.add("hidden");
    if (personalEmailInput) personalEmailInput.removeAttribute("required");
    if (firstStatusRadio) firstStatusRadio.removeAttribute("required");
  } else {
    if (uniEmailGroup) uniEmailGroup.classList.add("hidden");
    if (uniEmailInput) uniEmailInput.removeAttribute("required");
    if (personalEmailGroup) personalEmailGroup.classList.remove("hidden");
    if (studentStatusGroup) studentStatusGroup.classList.remove("hidden");
    if (personalEmailInput) {
      personalEmailInput.setAttribute("required", "required");
      if (!personalEmailInput.value && emailInput) {
        personalEmailInput.value = emailInput.value.trim();
        validateField("personalEmail", true);
      }
    }
    if (firstStatusRadio) firstStatusRadio.setAttribute("required", "required");
  }
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
   PAGE NAVIGATION
   ============================================ */
function goToPage(num){
  if(num<1||num>TOTAL_PAGES)return;
  clearValidation();

  pages.forEach(function(p){p.classList.remove("active")});
  pages[num-1].classList.add("active");
  currentPage=num;
  updateProgress();
  saveProgress();
  prevBtn.disabled=currentPage===1;
  var twrap=document.getElementById("turnstileWrap");
  if(currentPage===TOTAL_PAGES){
    nextBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    if(twrap)twrap.classList.remove("hidden");
  }else{
    nextBtn.classList.remove("hidden");
    submitBtn.classList.add("hidden");
    if(twrap)twrap.classList.add("hidden");
  }
  if(num===2){
    toggleVerificationFields();
  }
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ============================================
   PROGRESS AUTOSAVE
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
   DUPLICATE EMAIL CHECK
   ============================================ */
function checkEmailExists(email){
  if(!email)return Promise.resolve(false);
  return fetch("/api/check-email",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email:email})
  }).then(function(r){return r.json()}).then(function(d){return !!d.exists}).catch(function(){return false});
}

/* ============================================
   FORM SUBMISSION
   ============================================ */
if(prevBtn)prevBtn.addEventListener("click",function(){goToPage(currentPage-1)});
if(nextBtn)nextBtn.addEventListener("click",function(){
  if(!validatePage(currentPage))return;
  if(currentPage===1){
    var emailInput=form.querySelector("[name=\"email\"]");
    var emailVal=emailInput?emailInput.value.trim():"";
    if(emailVal){
      checkEmailExists(emailVal).then(function(exists){
        if(exists){
          showToast("You have already registered with this email.","error");
          return;
        }
        showToast("Progress saved","success");
        goToPage(currentPage+1);
      });
      return;
    }
  }
  showToast("Progress saved","success");
  goToPage(currentPage+1);
});

var confirmModal=document.getElementById("confirmModal");
var cancelConfirmBtn=document.getElementById("cancelConfirmBtn");
var closeConfirmBtn=document.getElementById("closeConfirmBtn");
var finalSubmitBtn=document.getElementById("finalSubmitBtn");

function hideConfirmModal(){
  if(confirmModal)confirmModal.classList.add("hidden");
}

function showConfirmModal(){
  if(confirmModal)confirmModal.classList.remove("hidden");
}

if(form)form.addEventListener("submit",function(e){
  e.preventDefault();
  if(!validatePage(currentPage))return;
  if(confirmModal){
    showConfirmModal();
  }else{
    executeSubmission();
  }
});

if(cancelConfirmBtn){
  cancelConfirmBtn.addEventListener("click",hideConfirmModal);
}

if(closeConfirmBtn){
  closeConfirmBtn.addEventListener("click",hideConfirmModal);
}

if(confirmModal){
  confirmModal.addEventListener("click",function(e){
    if(e.target===confirmModal){
      hideConfirmModal();
    }
  });
}

window.addEventListener("keydown",function(e){
  if(e.key==="Escape"&&confirmModal&&!confirmModal.classList.contains("hidden")){
    hideConfirmModal();
  }
});

// Turnstile widget lifecycle callbacks (wired via data-callback / data-error-callback)
window.turnstileSuccess=function(){
  var fb=document.getElementById("turnstileFallback");
  if(fb)fb.classList.add("hidden");
};
window.turnstileError=function(code){
  console.error("[turnstile] widget error code:",code);
  var fb=document.getElementById("turnstileFallback");
  if(!fb)return;
  fb.classList.remove("hidden");
  var msg=document.getElementById("turnstileErrMsg");
  var hint="DISABLE ADBLOCKER / CHECK CONNECTION, THEN RETRY.";
  if(typeof code==="number"){
    if(code>=110000&&code<200000)hint="SITEKEY OR DOMAIN NOT AUTHORIZED — CLOUDFLARE DASHBOARD → TURNSTILE → THIS SITE → SETTINGS → HOSTNAME MANAGEMENT → ADD sscpu.vercel.app";
    else if(code===200500)hint="CHALLENGES.CLOUDFLARE.COM IS BLOCKED — DISABLE ADBLOCKER / VPN / TRY INCOGNITO, THEN RETRY.";
    else if(code>=300000)hint="FLAGGED AS BOT — SWITCH NETWORK OR BROWSER, THEN RETRY.";
  }
  if(msg)msg.textContent="TURNSTILE ERR "+code+" — "+hint;
};

(function(){
  var retry=document.getElementById("turnstileRetry");
  if(!retry)return;
  retry.addEventListener("click",function(){
    if(typeof turnstile==="undefined")return;
    var container=form?form.querySelector(".cf-turnstile"):document.querySelector(".cf-turnstile");
    if(!container)return;
    var fb=document.getElementById("turnstileFallback");
    if(fb)fb.classList.add("hidden");
    try{turnstile.reset(container);}catch(e){console.error("[turnstile] reset failed:",e);}
  });
})();

if(finalSubmitBtn){
  finalSubmitBtn.addEventListener("click",function(){
    var token="";
    var el=form.querySelector('[name="cf-turnstile-response"]');
    if(el)token=el.value;
    if(!token){
      showToast("Please complete the CAPTCHA check.","error");
      return;
    }
    hideConfirmModal();
    executeSubmission();
  });
}

function executeSubmission(){
  if(submitBtn)submitBtn.disabled=true;
  if(finalSubmitBtn)finalSubmitBtn.disabled=true;
  if(submitBtn)submitBtn.textContent="Submitting…";
  var row=buildRegistrationRow();

  // Real-time Google Sheets Webhook
  var sheetWebhookUrl = "https://script.google.com/macros/s/AKfycbyiocTwcWP6Fc2obdIuWnX7M8X62DtkEDKpY1q0iH3l8UOk4uokopCyKi-z5wM9bqrOvg/exec";
  var sheetPayload = {
    fullName: row.full_name || "",
    email: row.email || "",
    contact: row.contact_number || "",
    faculty: row.faculty_institute || "",
    programme: row.programme_course || "",
    semester: row.current_semester_year || "",
    division: row.division_batch || "",
    enrollmentNumber: row.enrollment_number || row.uni_enrollment_id || "",
    hasUniEmail: row.has_uni_email ? "Yes" : "No",
    uniEmail: row.uni_email || "",
    personalEmail: row.personal_email || "",
    studentStatus: row.student_status || "",
    whyInterested: row.why_interested || "",
    hasIdea: row.has_idea || "",
    ideaPitch: row.idea_description || "",
    excitement: Array.isArray(row.excitement_level) ? row.excitement_level.join(", ") : (row.excitement_level || ""),
    buildInterest: Array.isArray(row.build_interest) ? row.build_interest.join(", ") : (row.build_interest || ""),
    macAccess: row.mac_access || "",
    deviceFrequency: row.device_frequency || "",
    needsMacLab: row.needs_mac_lab || "",
    prepHours: row.hours_per_week_prep || "",
    appExperience: row.app_experience || "",
    appleExperience: row.apple_experience || "",
    interests: Array.isArray(row.interests_improving) ? row.interests_improving.join(", ") : (row.interests_improving || ""),
    prevCompetitions: row.previous_competitions ? "Yes" : "No",
    competitionDetails: row.competition_details || "",
    commitmentLevel: row.commitment_level || "",
    programHours: row.hours_per_week_program || "",
    workSchedule: Array.isArray(row.work_schedule) ? row.work_schedule.join(", ") : (row.work_schedule || ""),
    attendSessions: row.willing_to_attend || "",
    github: row.github_profile || "",
    linkedin: row.linkedin_profile || "",
    portfolio: row.portfolio_website || "",
    additionalComments: row.anything_else || ""
  };

  fetch(sheetWebhookUrl, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(sheetPayload)
  }).catch(function(err){ console.error("Google Sheets sync error:", err); });

  var turnstileResponse = "";
  var turnstileElement = form.querySelector('[name="cf-turnstile-response"]');
  if (turnstileElement) {
    turnstileResponse = turnstileElement.value;
  }

  if (!turnstileResponse) {
    showToast("Please complete the CAPTCHA check.", "error");
    if(submitBtn)submitBtn.disabled=false;
    if(finalSubmitBtn)finalSubmitBtn.disabled=false;
    if(submitBtn)submitBtn.textContent="Submit Application";
    return;
  }

  fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      row: row,
      turnstileResponse: turnstileResponse
    })
  }).then(function(res) {
    return res.json().then(function(data) {
      if (res.ok) {
        showSuccess(row.email);
      } else {
        showToast(data.error || "An error occurred during registration.", "error");
        if(submitBtn)submitBtn.disabled=false;
        if(finalSubmitBtn)finalSubmitBtn.disabled=false;
        if(submitBtn)submitBtn.textContent="Submit Application";
      }
    });
  }).catch(function(err){
    console.error("Submit error:", err);
    showToast("A network error occurred. Please try again.", "error");
    if(submitBtn)submitBtn.disabled=false;
    if(finalSubmitBtn)finalSubmitBtn.disabled=false;
    if(submitBtn)submitBtn.textContent="Submit Application";
  });
}

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



/* live validation on change */
if(form)form.querySelectorAll("input,textarea").forEach(function(el){
  el.addEventListener("change",function(){
    if(el.closest(".field-group")&&el.closest(".field-group").classList.contains("has-error")){
      validateField(el.name, true);
    }
  });
  el.addEventListener("input",function(){
    if(el.classList.contains("error") || el.name === "uniEmail") validateField(el.name, true);
  });
});

/* "Other" write-in dynamic visibility & binding */
if(form){
  form.querySelectorAll(".radio-group").forEach(function(group){
    var writein = group.querySelector(".other-writein");
    if(!writein) return;
    var allRadios = group.querySelectorAll('input[type="radio"]');
    var otherRadio = Array.from(allRadios).find(function(r){
      return r.value === "Other" || r.dataset.isOther === "true";
    });
    if(!otherRadio) return;
    otherRadio.dataset.isOther = "true";

    function updateWriteinState(){
      if(otherRadio.checked){
        writein.classList.remove("hidden");
        otherRadio.value = writein.value.trim() ? writein.value.trim() : "Other";
      } else {
        writein.classList.add("hidden");
        writein.value = "";
        otherRadio.value = "Other";
      }
    }

    allRadios.forEach(function(r){
      r.addEventListener("change", function(){
        updateWriteinState();
        if(otherRadio.checked){
          writein.focus();
        }
      });
    });

    writein.addEventListener("input", function(){
      if(otherRadio.checked){
        otherRadio.value = writein.value.trim() ? writein.value.trim() : "Other";
      }
    });

    writein.addEventListener("focus", function(){
      if(!otherRadio.checked){
        otherRadio.checked = true;
        updateWriteinState();
      }
    });
  });
}

/* ============================================
   3D PARALLAX DEVICE SHOWCASE
   ============================================ */
function initDeviceParallax(){
  var stage=document.getElementById("devicesStage");
  if(!stage)return;
  var devices=stage.querySelectorAll(".device-float");
  var rafPending=false,lastX=0,lastY=0;

  if(typeof gsap==="undefined")return;

  var isMobile=function(){return window.matchMedia("(max-width:768px)").matches;};
  var macScale=function(){return isMobile()?0.65:0.8;};

  gsap.set(".device-iphone",{xPercent:-50,yPercent:-50,rotationY:-6,rotationX:3});
  gsap.set(".device-macbook",{xPercent:-50,yPercent:-50,rotationY:10,rotationX:-2,scale:macScale()});

  var introDone=false;

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
    if(!introDone)return;
    devices.forEach(function(dev){
      var speed=parseFloat(dev.dataset.speed)||1;
      var rY=x*12*speed, rX=-y*8*speed, tX=x*15*speed, tY=y*12*speed;
      if(dev.classList.contains("device-iphone")){
        gsap.to(dev,{rotationY:rY-6,rotationX:rX+3,x:tX,y:tY,duration:0.5,ease:"power2.out",overwrite:"auto"});
      }else if(dev.classList.contains("device-macbook")){
        gsap.to(dev,{rotationY:rY+10,rotationX:rX-2,x:tX,y:tY,duration:0.5,ease:"power2.out",overwrite:"auto"});
      }
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

  window.addEventListener("resize",function(){
    gsap.set(".device-macbook",{scale:macScale()});
  });
}

/* ============================================
   INIT
   ============================================ */
document.addEventListener("DOMContentLoaded",function(){
  var canHover = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var isMobile = window.matchMedia && window.matchMedia('(max-width:768px)').matches;

  /* Mobile: skip ALL visual FX — pure static page, only form logic runs */
  if(!isMobile){
    if(canHover) initLenis();
    initGSAP();
    initTilt();
    initMagneticButtons();
    initTouchRipple();
    if(canHover) initDeviceParallax();
  }
  initToastContainer();

  document.querySelectorAll('input[name="hasUniEmail"]').forEach(function(radio) {
    radio.addEventListener("change", toggleVerificationFields);
  });

  if(formSection&&!formSection.classList.contains("hidden")){
    var savedPage=restoreProgress();
    toggleVerificationFields();
    goToPage(savedPage&&savedPage>=1&&savedPage<=TOTAL_PAGES?savedPage:1);
  }else if(progressFill){
    updateProgress();
  }
});
})();
