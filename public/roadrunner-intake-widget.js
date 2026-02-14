/* Roadrunner OS Lead Intake Widget */
(function () {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (document.getElementById('roadrunner-intake-launcher')) return;

  const config = window.RoadrunnerIntakeWidget || {};
  const apiBase = (config.apiBase || '').replace(/\/$/, '');
  const endpoint = `${apiBase}/api/leads/intake`;

  const styles = `
    #roadrunner-intake-launcher {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 2147483647;
      border: 1px solid #3f5da0;
      background: linear-gradient(180deg, #2f4fa6 0%, #223d87 100%);
      color: #fff;
      font: 600 14px/1.2 Inter, sans-serif;
      border-radius: 999px;
      padding: 12px 16px;
      box-shadow: 0 12px 28px rgba(16, 30, 67, 0.44);
      cursor: pointer;
    }
    #roadrunner-intake-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      background: rgba(0, 0, 0, 0.48);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    #roadrunner-intake-modal {
      width: min(460px, 100%);
      border: 1px solid #273c67;
      border-radius: 16px;
      background: #0f1831;
      color: #e9f0ff;
      box-shadow: 0 28px 62px rgba(0, 0, 0, 0.52);
      font-family: Inter, sans-serif;
      padding: 16px;
    }
    #roadrunner-intake-modal h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
    .rrw-field {
      margin-top: 10px;
      display: block;
    }
    .rrw-field span {
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      color: #9fb0d5;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .rrw-field input, .rrw-field select, .rrw-field textarea {
      width: 100%;
      border: 1px solid #365489;
      border-radius: 10px;
      background: #111d39;
      color: #eaf0ff;
      font: 500 14px/1.3 Inter, sans-serif;
      padding: 10px 11px;
      box-sizing: border-box;
    }
    .rrw-actions {
      margin-top: 14px;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .rrw-actions button {
      border-radius: 10px;
      border: 1px solid #557bc8;
      background: #2a4ba8;
      color: #fff;
      font: 600 13px Inter, sans-serif;
      padding: 9px 12px;
      cursor: pointer;
    }
    .rrw-actions .rrw-cancel {
      border-color: #415f99;
      background: #1b2f59;
    }
    #rrw-message {
      margin-top: 10px;
      font-size: 13px;
      color: #a9bfdc;
      min-height: 20px;
    }
  `;

  const styleTag = document.createElement('style');
  styleTag.textContent = styles;
  document.head.appendChild(styleTag);

  const launcher = document.createElement('button');
  launcher.id = 'roadrunner-intake-launcher';
  launcher.type = 'button';
  launcher.textContent = config.buttonLabel || 'Get Pre-Approved';
  document.body.appendChild(launcher);

  const overlay = document.createElement('div');
  overlay.id = 'roadrunner-intake-overlay';
  overlay.innerHTML = `
    <div id="roadrunner-intake-modal" role="dialog" aria-modal="true" aria-label="Roadrunner lead form">
      <h3>Roadrunner Quick Lead Form</h3>
      <form id="rrw-form">
        <label class="rrw-field"><span>First name</span><input required name="first_name" /></label>
        <label class="rrw-field"><span>Last name</span><input required name="last_name" /></label>
        <label class="rrw-field"><span>Phone</span><input name="phone" /></label>
        <label class="rrw-field"><span>Email</span><input name="email" type="email" /></label>
        <label class="rrw-field"><span>Location</span>
          <select name="location_intent">
            <option value="">Best location</option>
            <option value="wayne">Wayne</option>
            <option value="taylor">Taylor</option>
          </select>
        </label>
        <label class="rrw-field"><span>What are you shopping for?</span><textarea rows="3" name="message"></textarea></label>
        <label class="rrw-field"><input type="checkbox" name="consent_sms" /> <span style="display:inline; text-transform:none; letter-spacing:normal;">I agree to SMS follow-up.</span></label>
        <div class="rrw-actions">
          <button type="button" class="rrw-cancel" id="rrw-cancel">Close</button>
          <button type="submit" id="rrw-submit">Send</button>
        </div>
        <div id="rrw-message"></div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('#rrw-form');
  const cancelButton = overlay.querySelector('#rrw-cancel');
  const message = overlay.querySelector('#rrw-message');
  const submitButton = overlay.querySelector('#rrw-submit');

  function openWidget() {
    overlay.style.display = 'flex';
  }

  function closeWidget() {
    overlay.style.display = 'none';
  }

  launcher.addEventListener('click', openWidget);
  cancelButton.addEventListener('click', closeWidget);
  overlay.addEventListener('click', function (event) {
    if (event.target === overlay) closeWidget();
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    submitButton.disabled = true;
    message.textContent = 'Sending...';

    const formData = new FormData(form);
    const params = new URLSearchParams(window.location.search);

    const payload = {
      first_name: String(formData.get('first_name') || ''),
      last_name: String(formData.get('last_name') || ''),
      phone: String(formData.get('phone') || ''),
      email: String(formData.get('email') || ''),
      source: 'website_form',
      message: String(formData.get('message') || ''),
      page_url: window.location.href,
      utm_source: params.get('utm_source') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      clicked_vehicle: config.clickedVehicle || undefined,
      location_intent: String(formData.get('location_intent') || ''),
      consent_sms: Boolean(formData.get('consent_sms')),
      consent_phone: false,
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Intake endpoint did not return a successful status.');

      message.textContent = 'Thanks. A Roadrunner rep will contact you shortly.';
      form.reset();
      window.setTimeout(closeWidget, 1200);
    } catch (error) {
      message.textContent = 'Could not submit right now. Please call (734) 415-4489.';
      if (window.console && typeof window.console.error === 'function') {
        window.console.error(error);
      }
    } finally {
      submitButton.disabled = false;
    }
  });
})();
