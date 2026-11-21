import { Fragment, useEffect, useRef, useState } from "react";

// Place the background video at public/shiftwise-bg.mp4 (or change this path).
const VIDEO_SRC = "/shiftwise-bg.mp4";

const P = [['Aisha', 'AK', 'var(--chart)'], ['Omar', 'OT', 'var(--lav)'], ['Maya', 'MR', 'var(--pers)'], ['Jon', 'JL', 'var(--chart)']];
const S = [['Early 7–3', 'a'], ['Late 3–11', 'b'], ['Mid 11–7', 'c'], ['Off', 'off']];
const D = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const pat = [[0, 0, 3, 1, 2], [1, 3, 0, 1, 0], [2, 1, 0, 0, 3], [3, 2, 1, 2, 0]];
const NAMES = ['Admin overview', 'Weekly shift planner', 'Employee schedule', 'Shift request management'];

function count(el) {
  const t = +el.dataset.n;
  let s = null;
  const f = (ts) => {
    s = s || ts;
    const k = Math.min((ts - s) / 1400, 1);
    el.textContent = Math.round(t * (1 - Math.pow(1 - k, 3))).toLocaleString();
    if (k < 1) requestAnimationFrame(f);
  };
  requestAnimationFrame(f);
}

export default function ShiftWise() {
  const [approved, setApproved] = useState(false);
  const [tip, setTip] = useState('Select a shift to see details.');
  const [a, setA] = useState(0);
  const vref = useRef(null);

  useEffect(() => {
    // scroll reveals + animated counters
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          e.target.querySelectorAll('[data-n]').forEach(count);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.2 });
    document.querySelectorAll('[data-io]').forEach((el) => io.observe(el));
    const t = setTimeout(() => document.querySelectorAll('.stats [data-n]').forEach(count), 900);
    // parallax
    const px = document.querySelectorAll('[data-px]');
    let tk = false;
    const onScroll = () => {
      if (tk) return;
      tk = true;
      requestAnimationFrame(() => {
        px.forEach((el) => {
          const r = el.parentNode.getBoundingClientRect();
          el.style.transform = 'translateY(' + r.top * el.dataset.px + 'px)';
        });
        tk = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    // background video
    if (vref.current) { vref.current.muted = true; vref.current.play().catch(() => {}); }
    return () => { io.disconnect(); clearTimeout(t); removeEventListener('scroll', onScroll); };
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <header><div className="wrap"><nav aria-label="Main">
       <a className="logo" href="#top" aria-label="ShiftWise home"><i></i>ShiftWise</a>
       <div className="links"><a href="#features">Features</a><a href="#how">How it works</a><a href="#benefits">Benefits</a><a href="#contact">Contact</a></div>
       <a className="btn s o login" href="#contact">Login</a><a className="btn s p" href="#contact">Get started</a>
      </nav></div></header>
      
      <main id="top">
      <div className="wrap"><div className="hero">
       <div>
        <p className="slogan fade"><b>ShiftWise</b><i aria-hidden="true">—</i><span>Where People and Plans Align</span></p>
        <h1 aria-label="Better shifts. Happier teams. One clear plan.">
         <span className="ln" aria-hidden="true"><span>Better <em>shifts.</em></span></span>
         <span className="ln" aria-hidden="true"><span>Happier <mark>teams.</mark></span></span>
         <span className="ln" aria-hidden="true"><span><em>One</em> clear plan.</span></span>
        </h1>
        <p className="sub fade d2">Bring your people, schedules and everyday operations together. Shift smarter, work better and keep everyone in sync.</p>
        <div className="row fade d3"><a className="btn p" href="#features">Explore ShiftWise</a><a className="btn o" href="#how">See how it works</a></div>
        <div className="stats fade d3">
         <div><b><span data-n="38">0</span>%</b><small>less time scheduling</small></div>
         <div><b><span data-n="1200">0</span></b><small>teams aligned</small></div>
         <div><b><span data-n="4">0</span>.8</b><small>average rating</small></div>
        </div>
       </div>
       <div className="scene fade d2"><div className="stack">
        <span className="slab s2" aria-hidden="true"></span><span className="slab s1" aria-hidden="true"></span>
        <div className="app" role="group" aria-label="Interactive schedule preview">
         <div className="bar"><i></i><i></i><i></i><span>app.shiftwise.com / schedule</span></div>
         <div className="hd"><b>Week of 24 Nov</b><span className="pill">Published</span></div>
         <div className="sc"><div className="grid">
                    <span></span>
                    {D.map((d) => <span key={d} className="dh">{d}</span>)}
                    {P.map((p, r) => (
                      <Fragment key={p[0]}>
                        <span className="who"><span className="av" style={{ background: p[2] }}>{p[1]}</span>{p[0]}</span>
                        {pat[r].map((s, c) => {
                          const swap = r === 2 && c === 3;
                          const label = S[s][0];
                          const t = `${p[0]} · ${D[c]} · ${label}${swap ? (approved ? ' (swapped)' : ' (swap pending)') : ''}`;
                          return (
                            <button key={c} className={`sh ${S[s][1]}${swap && !approved ? ' pend' : ''}`} data-t={t}
                              onClick={() => { if (s !== 3) setTip(t); }}>
                              {s === 3 ? '' : label.split(' ')[0]}
                            </button>
                          );
                        })}
                      </Fragment>
                    ))}
                  </div></div>
         <div className={`note${approved ? ' done' : ''}`} id="note">
                    <span className="av" style={{ background: 'var(--lav)' }}>MR</span>
                    {approved
                      ? <p><b>Swap approved.</b> Maya and Omar have been notified.</p>
                      : <p><b>Maya R.</b> asked to swap Thu Late with Omar.</p>}
                    {!approved && <button className="btn s p" id="ok" style={{ padding: '7px 14px' }} onClick={() => setApproved(true)}>Approve</button>}
                  </div>
                  <div className="tip" id="tip">{tip}</div>
        </div>
        <svg className="links3" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M4 -4 C40 -20 80 10 102 46" vectorEffect="non-scaling-stroke"/><path d="M102 52 C96 90 50 80 14 106" vectorEffect="non-scaling-stroke"/></svg>
        <div className="fc c1"><span className="av" style={{background:'var(--lav)'}}>OT</span><div><b>Late shift · 3–11</b>Omar T. assigned</div></div>
        <div className="fc c2"><span className="ring" aria-hidden="true"></span><div><b>94% covered</b>3 open shifts left</div></div>
        <div className="fc c3"><span className="avs"><span className="av" style={{background:'var(--chart)'}}>AK</span><span className="av" style={{background:'var(--pers)'}}>JL</span><span className="av" style={{background:'var(--lav)'}}>MR</span></span><div><b>24 on shift today</b><span className="dotk" style={{display:'inline-block',marginRight:'6px'}}></span>Schedule published</div></div>
       </div></div>
      </div></div>
      
      <div className="brand" id="benefits" data-io>
       <span className="ring" data-px=".08"></span><span className="dot" data-px="-.06"></span>
       <div className="wrap">
        <p className="rv">Work shouldn’t revolve around schedules.</p>
        <p className="rv">Schedules should work around people.</p>
       </div>
      </div>
      
      <section id="features"><div className="wrap" data-io>
       <h2 className="rv">Everything a shift needs, in one place.</h2>
       <div className="feat">
        <article className="f f1 rv"><h3>Smart Shift Planning</h3><p>Create and organize employee schedules with a clear weekly overview.</p>
         <div className="mini"><div className="wk" aria-hidden="true"><i style={{'--h':'60%'}}></i><i style={{'--h':'85%'}}></i><i style={{'--h':'100%'}}></i><i style={{'--h':'70%'}}></i><i style={{'--h':'90%'}}></i><i style={{'--h':'35%'}}></i><i style={{'--h':'25%'}}></i></div></div></article>
        <article className="f f2 rv"><h3>Employee Management</h3><p>Keep employee information organized and accessible.</p>
         <div className="mini"><div className="emp"><span className="av" style={{background:'var(--chart)'}}>AK</span>Aisha K.<em>Barista</em></div><div className="emp"><span className="av" style={{background:'var(--lav)'}}>OT</span>Omar T.<em>Floor lead</em></div><div className="emp"><span className="av" style={{background:'var(--pers)'}}>JL</span>Jon L.<em>Kitchen</em></div></div></article>
        <article className="f f3 rv"><h3>Shift Assignments</h3><p>Assign shifts and maintain visibility across the workforce.</p></article>
        <article className="f f4 rv"><h3>Shift Change Requests</h3><p>Allow employees to request schedule changes and administrators to review them.</p>
         <div className="mini"><div className="req"><span>Maya R. · Thu Late</span><b>Pending</b></div><div className="req"><span>Jon L. · Sat Early</span><b>Approved</b></div></div></article>
        <article className="f f5 rv"><h3>Centralized Workforce Overview</h3><p>See workforce activity and scheduling information in one place.</p>
         <div className="mini ov"><div><b><span data-n="86">0</span></b><span>staff on shift today</span></div><div><b><span data-n="12">0</span></b><span>open shifts</span></div><div><b><span data-n="3">0</span></b><span>requests waiting</span></div></div></article>
       </div>
      </div></section>
      
      <section id="how" style={{background:'#EAE5D8'}}><div className="wrap" data-io>
       <h2 className="rv">Three steps from scattered to aligned.</h2>
       <div className="steps">
        <svg viewBox="0 0 1000 20" preserveAspectRatio="none" aria-hidden="true"><path d="M110 10 H480 M600 10 H880" pathLength="1" vectorEffect="non-scaling-stroke"/></svg>
        <div className="st rv"><span className="n">01</span><h3>Organize your workforce.</h3><p>Add your people, roles and availability once.</p></div>
        <div className="st rv"><span className="n">02</span><h3>Plan and assign shifts.</h3><p>Build the week and publish it to everyone.</p></div>
        <div className="st rv"><span className="n">03</span><h3>Manage requests and stay aligned.</h3><p>Review changes as they come in.</p></div>
       </div>
      </div></section>
      
      <section className="show"><div className="wrap" data-io>
       <h2 className="rv">One product, two points of view.</h2>
       <div className="tabs" role="tablist" aria-label="Product views" id="tabs">
                {NAMES.map((n, i) => (
                  <button key={n} className="tab" role="tab" aria-selected={a === i} onClick={() => setA(i)}>{n}</button>
                ))}
              </div>
       <div className="stage" id="stage">
        <div className="win" data-i="0" data-p={(0 - a + 4) % 4}><div className="app"><div className="bar"><i></i><i></i><i></i><span>Admin overview</span></div><div className="bd"><h4>Today at a glance</h4><div className="ov"><div><b>86</b><span>on shift</span></div><div><b>12</b><span>open</span></div><div><b>3</b><span>requests</span></div></div><div className="wk" style={{marginTop:'18px'}}><i style={{'--h':'50%'}}></i><i style={{'--h':'80%'}}></i><i style={{'--h':'100%'}}></i><i style={{'--h':'60%'}}></i><i style={{'--h':'75%'}}></i></div></div></div></div>
        <div className="win" data-i="1" data-p={(1 - a + 4) % 4}><div className="app"><div className="bar"><i></i><i></i><i></i><span>Weekly shift planner</span></div><div className="bd"><h4>Plan the week</h4><div className="req"><span>Mon · Early</span><span className="pill">4 / 4 filled</span></div><div className="req"><span>Tue · Late</span><span className="pill" style={{background:'var(--pers)'}}>1 open</span></div><div className="req"><span>Wed · Early</span><span className="pill">3 / 3 filled</span></div><div className="req"><span>Thu · Late</span><span className="pill" style={{background:'var(--lav)'}}>2 / 3 filled</span></div></div></div></div>
        <div className="win" data-i="2" data-p={(2 - a + 4) % 4}><div className="app"><div className="bar"><i></i><i></i><i></i><span>Employee schedule</span></div><div className="bd"><h4>Your week, Aisha</h4><div className="req"><span>Mon</span><b>07:00–15:00</b></div><div className="req"><span>Wed</span><b>07:00–15:00</b></div><div className="req"><span>Fri</span><b>14:00–22:00</b></div><div className="row" style={{marginTop:'14px'}}><span className="pill">Request a swap</span></div></div></div></div>
        <div className="win" data-i="3" data-p={(3 - a + 4) % 4}><div className="app"><div className="bar"><i></i><i></i><i></i><span>Shift requests</span></div><div className="bd"><h4>Waiting for review</h4><div className="req"><span>Maya R. · Swap Thu Late</span><span className="pill" style={{background:'var(--lav)'}}>Pending</span></div><div className="req"><span>Jon L. · Sat Early off</span><span className="pill">Approved</span></div><div className="req"><span>Omar T. · Extra shift</span><span className="pill" style={{background:'var(--pers)'}}>Declined</span></div></div></div></div>
       </div>
      </div></section>
      
      <section className="cta" id="contact"><video className="cvid" ref={vref} autoPlay muted loop playsInline preload="auto" aria-hidden="true" tabIndex={-1} src={VIDEO_SRC}></video><div className="wrap" data-io>
       <h2 className="rv serif">Make every <mark>shift</mark> <em>count.</em></h2>
       <p className="rv">Bring clarity to your workforce. Start building better schedules with ShiftWise.</p>
       <a className="btn p rv" href="mailto:hello@shiftwise.example">Get Started</a>
      </div></section>
      </main>
      
      <footer><div className="wrap">
       <a className="logo" href="#top" style={{margin:'0'}}><i style={{background:'var(--parch)'}}></i>ShiftWise</a>
       <span>Where People and Plans Align</span>
       <nav aria-label="Footer"><a href="#features">Features</a><a href="#how">How it works</a><a href="#benefits">Benefits</a><a href="#contact">Contact</a></nav>
       <small>ShiftWise — Workforce Management System</small>
      </div></footer>
    </>
  );
}

const CSS = `@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,400;1,9..144,600&family=Inter+Tight:wght@400;500;600&display=swap');
:root{--ink:#202522;--parch:#F4F0E7;--pers:#EF7253;--chart:#C9D957;--lav:#B9ACD2;--char:#353B35;--line:rgba(32,37,34,.16);box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);color-scheme:light}
*,*::before,*::after{box-sizing:inherit;margin:0}
html{scroll-behavior:smooth;scroll-padding-top:80px}
body{background:var(--parch);color:var(--ink);font:400 17px/1.55 'Inter Tight',system-ui,sans-serif;overflow-x:hidden}
.serif{font-family:Fraunces,Georgia,serif}
a{color:inherit;text-decoration:none}
:focus-visible{outline:3px solid var(--pers);outline-offset:3px}
.wrap{max-width:1240px;margin:0 auto;padding:0 clamp(20px,4vw,48px)}
/* nav */
header{position:sticky;top:env(safe-area-inset-top,0px);z-index:20;background:var(--parch);border-bottom:1px solid var(--line)}
nav{display:flex;align-items:center;gap:32px;height:68px}
.logo{display:flex;align-items:center;gap:10px;font:600 21px Fraunces,serif;margin-right:auto}
.logo i{width:26px;height:26px;background:var(--ink);border-radius:50% 50% 50% 4px;position:relative}
.logo i::after{content:"";position:absolute;inset:7px;background:var(--chart);border-radius:50%}
.links{display:flex;gap:28px;font-size:15px;font-weight:500}
.links a{position:relative}.links a::after{content:"";position:absolute;left:0;bottom:-4px;height:2px;width:100%;background:var(--pers);transform:scaleX(0);transform-origin:left;transition:transform .3s}
.links a:hover::after{transform:scaleX(1)}
.btn{display:inline-block;padding:14px 26px;font-weight:600;font-size:15px;border:1.5px solid var(--ink);border-radius:4px;transition:transform .25s,background .25s,color .25s;cursor:pointer;font-family:inherit;background:none;color:var(--ink)}
.btn:hover{transform:translateY(-2px)}
.btn.p{background:var(--pers);border-color:var(--pers);color:var(--ink)}.btn.p:hover{background:var(--ink);color:var(--parch);border-color:var(--ink)}
.btn.s{padding:9px 18px}
.btn.o:hover{background:var(--ink);color:var(--parch)}
@media(max-width:860px){.links,.login{display:none}}
/* hero */
.hero{display:grid;grid-template-columns:1.05fr 1fr;gap:48px;align-items:center;min-height:calc(100svh - 68px);padding:48px 0 72px}
.lab{font-size:13px;font-weight:600;letter-spacing:.12em;margin-bottom:24px}
h1{font:500 clamp(46px,7vw,98px)/.94 Fraunces,serif;letter-spacing:-.03em}
h1 .ln{display:block;overflow:hidden;padding-bottom:.08em}
h1 .ln span{display:inline-block;transform:translateY(110%);animation:up .9s cubic-bezier(.2,.8,.2,1) forwards}
h1 .ln:nth-child(2) span{animation-delay:.12s}h1 .ln:nth-child(3) span{animation-delay:.24s}
h1 em{font-style:italic;font-weight:400;color:var(--pers)}
h1 mark{background:linear-gradient(transparent 62%,var(--chart) 62% 92%,transparent 92%);color:inherit;padding:0 .05em}
@keyframes up{to{transform:none}}
.fade{opacity:0;animation:fi .8s .5s forwards}.fade.d2{animation-delay:.7s}.fade.d3{animation-delay:.9s}
@keyframes fi{to{opacity:1}}
.sub{max-width:460px;margin:28px 0 32px;font-size:19px}
.row{display:flex;gap:14px;flex-wrap:wrap}
.stats{display:flex;gap:40px;margin-top:48px;padding-top:24px;border-top:1px solid var(--line)}
.stats b{display:block;font:500 40px/1 Fraunces,serif}.stats small{font-size:14px;color:var(--char)}
@media(max-width:960px){.hero{grid-template-columns:1fr;min-height:0}.stats{gap:24px}}
/* app preview */
.app{background:#FBF9F4;border:1.5px solid var(--ink);border-radius:8px;box-shadow:10px 10px 0 var(--ink);font-size:13px;overflow:hidden}
.bar{display:flex;align-items:center;gap:6px;padding:10px 14px;background:var(--ink);color:var(--parch)}
.bar i{width:9px;height:9px;border-radius:50%;background:var(--char);border:1px solid #66706a}
.bar span{margin-left:10px;font-size:12px;opacity:.8}
.float{animation:fl 7s ease-in-out infinite}
@keyframes fl{50%{transform:translateY(-10px)}}
.hd{display:flex;justify-content:space-between;align-items:center;padding:14px 16px 8px}
.hd b{font:500 18px Fraunces,serif}
.pill{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:600;background:var(--chart)}
.grid{display:grid;grid-template-columns:96px repeat(5,1fr);gap:4px;padding:6px 12px 14px;min-width:520px}
.sc{overflow-x:auto}
.grid .dh{font-size:11px;font-weight:600;text-align:center;color:var(--char);padding-bottom:4px}
.who{display:flex;align-items:center;gap:7px;font-weight:500;font-size:12px}
.av{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;font-weight:700;flex:none}
.sh{border:0;border-radius:4px;padding:7px 4px;font:600 11px 'Inter Tight';text-align:left;cursor:pointer;background:#e9e4d8;color:var(--ink);transition:transform .2s,box-shadow .2s;position:relative;min-height:32px}
.sh:hover{transform:scale(1.06);z-index:2;box-shadow:0 4px 0 var(--ink)}
.sh.a{background:var(--chart)}.sh.b{background:var(--lav)}.sh.c{background:var(--pers)}.sh.off{background:none;border:1px dashed var(--line);cursor:default}.sh.off:hover{transform:none;box-shadow:none}
.sh.pend::after{content:"";position:absolute;top:4px;right:4px;width:7px;height:7px;border-radius:50%;background:var(--ink);animation:pu 1.6s infinite}
@keyframes pu{50%{opacity:.2}}
.note{display:flex;gap:12px;align-items:center;margin:0 14px 14px;padding:10px 12px;border:1.5px solid var(--ink);background:var(--parch);border-radius:6px;transition:opacity .4s,max-height .4s}
.note p{flex:1;line-height:1.3}.note.done{background:var(--chart)}
.tip{padding:0 16px 14px;font-size:12px;min-height:30px;color:var(--char)}
.slogan{font:italic 400 clamp(18px,1.7vw,23px)/1.2 Fraunces,Georgia,serif;letter-spacing:.03em;color:var(--char);margin-bottom:26px;display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .45em}
.slogan b{font-style:normal;font-weight:600;letter-spacing:.01em;color:var(--ink);font-size:1.18em;padding-bottom:2px;border-bottom:2px solid var(--pers)}
.slogan i{color:var(--pers);font-style:normal}
.scene{perspective:1500px;padding:44px 30px 52px;position:relative}
.stack{position:relative;transform-style:preserve-3d;transform:rotateX(8deg) rotateY(-14deg);animation:enter 1.4s .6s cubic-bezier(.2,.8,.2,1) backwards,sway 16s 2s ease-in-out infinite alternate}
@keyframes enter{from{opacity:0;transform:translateX(70px) rotateX(18deg) rotateY(-42deg) scale(.9)}}
@keyframes sway{from{transform:rotateX(8deg) rotateY(-14deg)}to{transform:rotateX(4deg) rotateY(-4deg)}}
.stack .app{position:relative;transform:translateZ(0)}
.stack .grid{min-width:440px}
.slab{position:absolute;inset:0;border:1.5px solid var(--ink);border-radius:8px}
.slab.s1{background:var(--pers);transform:translate3d(26px,26px,-45px)}
.slab.s2{background:var(--chart);transform:translate3d(52px,52px,-90px)}
.fc{position:absolute;z-index:3;display:flex;align-items:center;gap:10px;padding:10px 14px;background:var(--parch);border:1.5px solid var(--ink);border-radius:6px;box-shadow:5px 5px 0 var(--ink);font-size:13px;line-height:1.25;transform:translate3d(0,0,var(--z));animation:bob 6s ease-in-out infinite;animation-delay:var(--d,0s)}
.fc b{display:block;font-size:14px}
@keyframes bob{50%{transform:translate3d(0,-9px,var(--z))}}
.fc.c1{top:-40px;left:-30px;--z:90px;background:var(--chart)}
.fc.c2{right:-34px;top:40%;--z:110px;--d:-2s;background:var(--ink);color:var(--parch);border-color:var(--ink);box-shadow:5px 5px 0 var(--pers)}
.fc.c3{bottom:-38px;left:7%;--z:70px;--d:-4s}
.ring{width:38px;height:38px;border-radius:50%;background:conic-gradient(var(--chart) 0 94%,var(--char) 0);display:grid;place-items:center;flex:none}
.ring::after{content:"";width:26px;height:26px;border-radius:50%;background:var(--ink)}
.avs{display:flex}.avs .av{border:2px solid var(--parch);margin-left:-7px}.avs .av:first-child{margin:0}
.dotk{width:9px;height:9px;border-radius:50%;background:var(--chart);animation:pu 1.6s infinite;flex:none}
.links3{position:absolute;inset:0;width:100%;height:100%;overflow:visible;transform:translateZ(40px);pointer-events:none}
.links3 path{fill:none;stroke:var(--ink);stroke-width:1.5;stroke-dasharray:5 6;animation:dash 2.4s linear infinite}
@keyframes dash{to{stroke-dashoffset:-22}}
@media(max-width:960px){.scene{max-width:640px;margin:0 auto;width:100%}}
@media(max-width:560px){.scene{padding:36px 14px 46px}.fc.c1{left:-6px}.fc.c2{right:-6px}.slab.s1{transform:translate3d(14px,14px,-45px)}.slab.s2{transform:translate3d(28px,28px,-90px)}}
/* brand statement */
.brand{background:var(--lav);padding:clamp(80px,14vw,180px) 0;position:relative;overflow:hidden}
.brand p{font:500 clamp(34px,6.2vw,92px)/1.02 Fraunces,serif;letter-spacing:-.025em;max-width:16ch}
.brand p+p{margin:.5em 0 0 auto;font-style:italic;font-weight:400;color:var(--ink);max-width:15ch}
.brand .ring{position:absolute;right:-8vw;top:-10vw;width:34vw;height:34vw;border-radius:50%;border:2px solid var(--ink);opacity:.25;will-change:transform}
.brand .dot{position:absolute;left:6vw;bottom:-4vw;width:14vw;height:14vw;border-radius:50%;background:var(--chart);will-change:transform}
.brand .wrap{position:relative}
/* sections */
section{padding:clamp(72px,10vw,140px) 0}
h2{font:500 clamp(34px,4.6vw,64px)/1 Fraunces,serif;letter-spacing:-.02em;max-width:14ch}
.feat{display:grid;grid-template-columns:repeat(12,1fr);gap:20px;margin-top:56px}
.f{border-top:1.5px solid var(--ink);padding-top:18px;transition:background .3s}
.f h3{font:500 26px/1.1 Fraunces,serif;margin-bottom:8px}.f p{max-width:36ch;color:var(--char)}
.f:hover h3{color:var(--pers)}
.f1{grid-column:1/8}.f2{grid-column:9/13;margin-top:70px}.f3{grid-column:1/6}.f4{grid-column:6/13;margin-top:40px}.f5{grid-column:3/11}
@media(max-width:860px){.f{grid-column:1/-1!important;margin-top:0!important}}
.mini{margin-top:22px;background:#FBF9F4;border:1.5px solid var(--ink);border-radius:6px;padding:14px;font-size:13px}
.wk{display:flex;gap:6px;align-items:flex-end;height:90px}
.wk i{flex:1;background:var(--lav);border-radius:3px 3px 0 0;height:var(--h);transform-origin:bottom;transform:scaleY(0);transition:transform 1s cubic-bezier(.2,.8,.2,1)}
.in .wk i{transform:none}.wk i:nth-child(odd){background:var(--chart)}.wk i:nth-child(3){background:var(--pers)}
.emp{display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--line)}.emp:last-child{border:0}.emp em{margin-left:auto;font-style:normal;font-size:12px;color:var(--char)}
.ov{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.ov b{display:block;font:500 44px/1 Fraunces,serif}.ov span{font-size:13px}
/* steps */
.steps{position:relative;display:grid;grid-template-columns:repeat(3,1fr);gap:40px;margin-top:64px}
.steps svg{position:absolute;left:0;top:34px;width:100%;height:20px;overflow:visible}
.steps path{stroke:var(--pers);stroke-width:2;fill:none;stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset 2s ease}
.in .steps path{stroke-dashoffset:0}
.st{position:relative;padding-top:80px}
.st .n{position:absolute;top:0;width:68px;height:68px;border-radius:50%;background:var(--ink);color:var(--parch);display:grid;place-items:center;font:500 26px Fraunces,serif;transition:background .4s .6s,color .4s .6s}
.in .st .n{background:var(--chart);color:var(--ink)}
.st h3{font:500 26px/1.1 Fraunces,serif;margin-bottom:8px}.st p{color:var(--char);max-width:30ch}
@media(max-width:860px){.steps{grid-template-columns:1fr}.steps svg{display:none}.st{padding:0 0 0 90px}}
/* showcase */
.show{background:var(--ink);color:var(--parch)}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:32px 0 40px}
.tab{padding:9px 18px;border:1.5px solid var(--parch);background:none;color:var(--parch);font:500 14px 'Inter Tight';border-radius:99px;cursor:pointer;transition:.25s}
.tab[aria-selected=true]{background:var(--chart);color:var(--ink);border-color:var(--chart)}
.stage{position:relative;height:clamp(420px,52vw,540px)}
.win{position:absolute;width:62%;color:var(--ink);transition:transform .7s cubic-bezier(.2,.8,.2,1),opacity .5s,z-index 0s .2s;box-shadow:0 24px 60px rgba(0,0,0,.45)}
.win .app{box-shadow:none;border-color:#000}
.win[data-p="0"]{left:0;top:0;transform:none;z-index:3}
.win[data-p="1"]{left:19%;top:70px;transform:scale(.96);z-index:2;opacity:.85}
.win[data-p="2"]{left:38%;top:140px;transform:scale(.92);z-index:1;opacity:.7}
.win[data-p="3"]{left:38%;top:140px;transform:scale(.88);z-index:0;opacity:0;pointer-events:none}
.bd{padding:18px;min-height:230px}
.bd h4{font:500 20px Fraunces,serif;margin-bottom:10px}
.req{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
@media(max-width:760px){.win{width:92%}.win[data-p="1"]{left:4%;top:50px}.win[data-p="2"]{left:8%;top:100px}.stage{height:520px}}
/* cta */
.cta{background:var(--ink);color:var(--parch);position:relative;overflow:hidden;border-top:1px solid var(--char)}
.cta .cvid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
.cta::before{content:"";position:absolute;inset:0;background:rgba(32,37,34,.72);z-index:1}
.cta .wrap{position:relative;z-index:2}
@media(prefers-reduced-motion:reduce){.cta .cvid{display:none}}
.cta h2{font-size:clamp(48px,10vw,150px);max-width:none;line-height:.92}
.cta h2 em{color:var(--pers)}.cta h2 mark{background:var(--chart);color:var(--ink);padding:0 .12em;font-style:normal}
.cta p{max-width:44ch;margin:28px 0 36px;font-size:19px;opacity:.85}
footer{background:var(--ink);color:var(--parch);padding:0 0 40px}
footer .wrap{display:flex;flex-wrap:wrap;gap:24px 48px;align-items:center;border-top:1px solid var(--char);padding-top:32px}
footer nav{height:auto;gap:24px;margin-left:auto;font-size:15px}
footer small{width:100%;opacity:.55;font-size:13px}
/* reveal */
.rv{opacity:0;transform:translateY(28px);transition:opacity .8s,transform .8s cubic-bezier(.2,.8,.2,1)}
.in.rv,.in .rv{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}h1 .ln span,.fade,.rv{opacity:1;transform:none}.wk i{transform:none}.steps path{stroke-dashoffset:0}}`;
