'use client';

import { useEffect, useRef, useState } from 'react';
import { usePopup } from './GhlPage';
import { submitLead } from '@/lib/tracking';
import { BOOKING_PATH } from '@/lib/config';
import './ghl-form.css';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Auto-open triggers (the popup auto-opens at most once per page view, and never after it was already opened).
const AUTO_OPEN_AFTER_MS = 20000; // time on page
const AUTO_OPEN_SCROLL_SCREENS = 1; // scrolled distance, in screen heights

/** Splits "+44 7700 900123" style input into dial code + number; plain numbers default to India (+91). */
function parsePhone(raw) {
  const value = String(raw || '').trim();
  if (value.startsWith('+')) return { dialCode: '', countryIso: '', phone: value };
  return { dialCode: '91', countryIso: 'in', phone: value };
}

/**
 * Replica of the GHL popup (hl_main_popup-iO7Hyt7YG3) with its form (F98dAMPX9fCM87fxpqS6).
 * Sends the lead to the webhook + Meta Pixel, then goes to the booking step like the GHL form did.
 */
export default function LeadFormPopup({ exitIntent = false }) {
  const { isOpen, open, close } = usePopup();
  const [values, setValues] = useState({ first_name: '', phone: '', email: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const autoShown = useRef(false);

  // Once the popup has been open (by a button or a trigger), it is not auto-opened again.
  useEffect(() => {
    if (isOpen) autoShown.current = true;
  }, [isOpen]);

  // Auto-open triggers:
  // - exit intent, same as GHL: the mouse leaves through the top/left edge of the window (incl. moving to the tab bar);
  // - coming back to the tab after switching away;
  // - AUTO_OPEN_AFTER_MS on the page, or scrolling AUTO_OPEN_SCROLL_SCREENS screen heights down (also covers mobile).
  useEffect(() => {
    if (!exitIntent) return undefined;
    const trigger = () => {
      if (autoShown.current) return;
      autoShown.current = true;
      open();
    };

    const onOut = (e) => {
      const to = e.relatedTarget || e.toElement;
      if ((!to || to.nodeName === 'HTML') && (e.clientX <= 0 || e.clientY <= 0)) trigger();
    };
    let wasHidden = document.visibilityState === 'hidden';
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') wasHidden = true;
      else if (wasHidden) trigger();
    };
    const onScroll = () => {
      if (window.scrollY >= window.innerHeight * AUTO_OPEN_SCROLL_SCREENS) trigger();
    };
    const timer = setTimeout(trigger, AUTO_OPEN_AFTER_MS);

    document.addEventListener('mouseout', onOut, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll);
    };
  }, [exitIntent, open]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  if (!isOpen) return null;

  const set = (name) => (e) => {
    setValues((v) => ({ ...v, [name]: e.target.value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const next = {};
    if (String(values.phone).replace(/\D/g, '').length < 7) next.phone = 'Please enter a valid phone number';
    if (!EMAIL_RE.test(values.email.trim())) next.email = 'Please enter a valid email address';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await submitLead({
        firstName: values.first_name,
        lastName: '',
        email: values.email,
        ...parsePhone(values.phone),
      });
    } catch { /* never block the funnel */ }
    window.location.assign(BOOKING_PATH);
  };

  return (
    <div
      id="overlay"
      className="show"
      style={{ display: 'block', backgroundColor: 'var(--overlay)', zIndex: 100 }}
    >
      <div id="hl_main_popup-iO7Hyt7YG3" className="popup-body show hl_main_popup-iO7Hyt7YG3 hl_main_popup borderFull radius2 none" style={{ zIndex: 100 }}>
        <div
          className="bg bgCover bg-hl_main_popup-iO7Hyt7YG3-popup-bg none"
          style={{ borderRadius: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        ></div>
        <div className="closeLPModal" onClick={close} role="button" tabIndex={0} aria-label="Close" onKeyDown={(e) => e.key === 'Enter' && close()}>
          <img src="/images/close-popup.png" alt="close" width="39" height="37" />
        </div>
        <div className="drop-zone-draggable">
          <div id="row-dpUVSmKtw0" className="row-align-center noBorder radius0 none c-row c-wrapper row-dpUVSmKtw0">
            <div className="inner">
              <div id="col-7bYrf7hxcN" className="noBorder radius0 none c-column c-wrapper col-7bYrf7hxcN">
                <div className="vertical inner">
                  <div id="form-BZRrN_WJZd" className="c-form c-wrapper form-BZRrN_WJZd">
                    <div className="cform-BZRrN_WJZd">
                      <div className="hl-app">
                        <section id="form-builder" className="hl_form-builder--main hl_form-builder--main-full">
                          <div className="ghl-form-wrap">
                            <form id="_builder-form" name="builder-form" className="form-builder--wrap form-builder--wrap-full" onSubmit={onSubmit} noValidate>
                              <div className="form-side">
                                <div className="flex-col row fields-container">
                                  <div className="col-12 form-field-wrapper">
                                    <div className="form-builder--item">
                                      <label className="label-alignment field-label" htmlFor="first_name">First Name </label>
                                      <input type="text" placeholder="First Name" name="first_name" className="form-control" id="first_name" autoComplete="given-name" value={values.first_name} onChange={set('first_name')} />
                                    </div>
                                  </div>
                                  <div className="col-12 form-field-wrapper">
                                    <div className="form-builder--item">
                                      <label className="label-alignment field-label" htmlFor="phone">Phone <span>*</span></label>
                                      <div className="phone-input flex">
                                        <input type="tel" name="phone" placeholder="Phone" autoComplete="tel" className={`form-control${errors.phone ? ' input-error' : ''}`} id="phone" required value={values.phone} onChange={set('phone')} />
                                      </div>
                                      {errors.phone ? <div className="error">{errors.phone}</div> : null}
                                    </div>
                                  </div>
                                  <div className="col-12 form-field-wrapper form-field-email">
                                    <div className="form-builder--item">
                                      <label className="label-alignment field-label" htmlFor="email">Email <span>*</span></label>
                                      <div className="icon-field">
                                        <svg className="field-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2 7l8.165 5.715c.661.463.992.695 1.351.784a2 2 0 00.968 0c.36-.09.69-.32 1.351-.784L22 7M6.8 20h10.4c1.68 0 2.52 0 3.162-.327a3 3 0 001.311-1.311C22 17.72 22 16.88 22 15.2V8.8c0-1.68 0-2.52-.327-3.162a3 3 0 00-1.311-1.311C19.72 4 18.88 4 17.2 4H6.8c-1.68 0-2.52 0-3.162.327a3 3 0 00-1.311 1.311C2 6.28 2 7.12 2 8.8v6.4c0 1.68 0 2.52.327 3.162a3 3 0 001.311 1.311C4.28 20 5.12 20 6.8 20z" />
                                        </svg>
                                        <input type="email" name="email" placeholder="Email" autoComplete="email" className={`form-control${errors.email ? ' input-error' : ''}`} id="email" required value={values.email} onChange={set('email')} />
                                      </div>
                                      {errors.email ? <div className="error">{errors.email}</div> : null}
                                    </div>
                                  </div>
                                  <div className="col-12 form-field-wrapper form-btn-wrapper">
                                    <button type="submit" className="btn btn-dark button-element" disabled={submitting}>
                                      {submitting ? <span className="btn-spinner" aria-hidden="true"></span> : 'ENROLL NOW'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </form>
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
