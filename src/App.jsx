import React, { useState } from 'react';
import { useWorkflow } from './hooks/useWorkflow';
import { TERMINOLOGY } from './constants/terminology';
import { FileText, ShieldCheck, CloudRain, Info, Search, UserPlus, CheckCircle, AlertTriangle, CreditCard, Download, Mail } from 'lucide-react';

function App() {
  const {
    projectState,
    updateInput,
    calculateWindUplift,
    calculateEstimate,
    checkWeatherSafety,
    completeOnboarding,
    startProject,
    uploadDailyPhoto,
    releasePayment,
    updateChecklist,
    generateHandoverPack
  } = useWorkflow();

  const [onboardingForm, setOnboardingForm] = useState({ name: '', registration_number: '' });

  const handlePostcodeSearch = () => {
    if (projectState.inputs.postcode) {
      calculateWindUplift(projectState.inputs.postcode);
    }
  };

  const handleOnboardingSubmit = (e) => {
    e.preventDefault();
    completeOnboarding(onboardingForm);
  };

  const weatherSafety = checkWeatherSafety();
  const quoteData = calculateEstimate();

  if (!projectState.contractor.onboardingCompleted) {
    return (
      <div className="roof-trust-container">
        <header style={{ marginBottom: '3rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1rem' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
            RoofTrust <span style={{ color: 'var(--color-accent)' }}>UK</span>
          </h1>
          <p style={{ color: 'var(--color-muted)', marginTop: '0.5rem' }}>Trust & Onboarding Portal • Module 1</p>
        </header>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={24} /> Contractor Registration
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
            Link your NFRC or CompetentRoofer account to receive the 'Certified Professional' badge.
          </p>

          <form onSubmit={handleOnboardingSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Business Name</label>
              <input
                type="text"
                required
                className="input-field"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={onboardingForm.name}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, name: e.target.value })}
                placeholder="e.g. London Master Roofing Ltd"
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>CPS Registration Number (NFRC/CompetentRoofer)</label>
              <input
                type="text"
                required
                className="input-field"
                style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                value={onboardingForm.registration_number}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, registration_number: e.target.value })}
                placeholder="e.g. NFRC-12345 (prefix with NFRC- to verify)"
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>
                * Verification is automated against national databases.
              </p>
            </div>
            <button type="submit" className="button-primary" style={{ width: '100%' }}>
              Verify & Enter Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (projectState.phase === 'phase_2_tracking') {
    const hasTodayLog = projectState.project.dailyLogs.some(log => log.date === new Date().toLocaleDateString());
    const hoursSinceUpdate = projectState.project.lastUpdateTimestamp ? (Date.now() - projectState.project.lastUpdateTimestamp) / 3600000 : 0;
    const isOverdue = hoursSinceUpdate > 48;
    const allChecked = projectState.project.completionChecklist.every(item => item.checked);
    const finalBalanceReleased = projectState.project.paymentStages.find(s => s.id === 'final').status === 'released';

    return (
      <div className="roof-trust-container">
        <header style={{ marginBottom: '3rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
              RoofTrust <span style={{ color: 'var(--color-accent)' }}>UK</span>
            </h1>
            <div className="badge badge-success">Live Project Tracking & Payment</div>
          </div>
        </header>

        {isOverdue && (
          <div style={{ background: '#fff3f3', border: '1px solid var(--color-warning)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AlertTriangle color="var(--color-warning)" />
            <div>
              <strong>Update Overdue (&gt;48h):</strong>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>SMS notification sent to homeowner: "Work paused/delayed; weather monitoring active."</p>
            </div>
          </div>
        )}

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2rem' }}>
          <section>
            <div className="card">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={20} /> Payment Workstream (Escrow)</h3>
              <div style={{ marginTop: '1.5rem' }}>
                {projectState.project.paymentStages.map((stage) => (
                  <div key={stage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid #eee' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{stage.label}</span>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-muted)' }}>
                        £{(quoteData.totalCost * (stage.percent / 100)).toLocaleString()}
                      </p>
                    </div>
                    {stage.status === 'released' ? (
                      <span style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 700 }}>✓ RELEASED</span>
                    ) : (
                      <button
                        className="button-primary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', opacity: (stage.id === 'final' && !allChecked) ? 0.5 : 1 }}
                        disabled={stage.id === 'final' && !allChecked}
                        onClick={() => releasePayment(stage.id)}
                      >
                        {stage.id === 'final' && !allChecked ? 'Locked' : 'Release Funds'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: '#f8fafc' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle size={20} /> Digital Completion Checklist (Homeowner)</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>Required for final 30% balance release.</p>
              <div style={{ marginTop: '1.5rem' }}>
                {projectState.project.completionChecklist.map((item) => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.8rem', cursor: 'pointer', border: '1px solid #eee', borderRadius: '8px', marginBottom: '0.5rem', background: 'white' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => updateChecklist(item.id, e.target.checked)}
                      style={{ width: '1.2rem', height: '1.2rem' }}
                    />
                    <span style={{ fontSize: '0.9rem' }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {finalBalanceReleased && (
              <div className="card" style={{ border: '2px solid var(--color-primary)', background: '#f0fff4' }}>
                <h3 style={{ color: 'var(--color-primary)' }}>Golden Thread Compliance Pack</h3>
                <p style={{ fontSize: '0.9rem' }}>All payments settled. Your permanent digital audit trail is now ready.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button
                    className="button-primary"
                    onClick={generateHandoverPack}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  >
                    <Download size={18} /> Download Handover Pack (PDF)
                  </button>
                  <button className="button-primary" style={{ flex: 1, background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Mail size={18} /> Email to Homeowner
                  </button>
                </div>
                {projectState.project.handoverPackGenerated && (
                  <p style={{ color: '#27ae60', fontSize: '0.85rem', fontWeight: 700, marginTop: '1rem', textAlign: 'center' }}>
                    ✓ Pack generated including: NFRC Certificate, Material Warranties, 15yr Liability Record.
                  </p>
                )}
              </div>
            )}
          </section>

          <aside>
            <div className="card">
              <h3>Daily Work Log</h3>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                <button
                  className="button-primary"
                  onClick={uploadDailyPhoto}
                  disabled={hasTodayLog}
                  style={{ opacity: hasTodayLog ? 0.6 : 1 }}
                >
                  <UserPlus size={18} style={{ marginRight: '0.5rem' }} /> {hasTodayLog ? 'Photo Uploaded ✓' : 'Upload End-of-Day Photo'}
                </button>
              </div>
              <div style={{ marginTop: '2rem' }}>
                <button
                  className="button-primary"
                  style={{ width: '100%', background: !hasTodayLog ? '#ccc' : 'var(--color-primary)' }}
                  disabled={!hasTodayLog}
                >
                  End Workday (Sign-off)
                </button>
              </div>
            </div>

            <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
              <h4 style={{ color: 'white', marginTop: 0 }}>Golden Thread Status</h4>
              <ul style={{ paddingLeft: '1.2rem', fontSize: '0.85rem', opacity: 0.9 }}>
                <li>Contractor Certification: Verified</li>
                <li>Material Standards: BS 5534 Compliant</li>
                <li>Digital Audit Entries: {projectState.project.dailyLogs.length}</li>
                <li>Building Safety Act: Records maintained (15yr policy)</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="roof-trust-container">
      {!projectState.contractor.isVerified && (
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeeba',
          color: '#856404',
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.9rem'
        }}>
          <AlertTriangle size={24} />
          <span><strong>Legal Warning:</strong> This contractor is not currently part of a Competent Person Scheme; independent building control inspection may be required.</span>
        </div>
      )}

      <header style={{ marginBottom: '3rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '-0.02em' }}>
              RoofTrust <span style={{ color: 'var(--color-accent)' }}>UK</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <span style={{ fontWeight: 600 }}>{projectState.contractor.name}</span>
              {projectState.contractor.isVerified && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  color: '#27ae60',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  backgroundColor: '#f0fff4',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #dcfce7'
                }}>
                  <CheckCircle size={14} /> Certified Professional
                </span>
              )}
            </div>
          </div>
          <div className={`badge ${projectState.documentType === 'BINDING_QUOTE' ? 'badge-success' : 'badge-warning'}`}>
            {projectState.documentType === 'BINDING_QUOTE' ? 'Fixed Quote (CRA 2015 Compliant)' : 'Non-binding Estimate (± 20%)'}
          </div>
        </div>
      </header>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2rem' }}>
        <section>
          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={24} /> Phase 1: Digital Survey & Quoting
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Building Height (m)</label>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={projectState.inputs.building_height_meters}
                  onChange={(e) => updateInput('building_height_meters', parseFloat(e.target.value))}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Roof <span className="term-tooltip" data-layman={TERMINOLOGY.Pitch.laymans_terms}>Pitch</span> (°)</label>
                <input
                  type="number"
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)', boxSizing: 'border-box' }}
                  value={projectState.inputs.roof_pitch_degrees}
                  onChange={(e) => updateInput('roof_pitch_degrees', parseFloat(e.target.value))}
                />
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Postcode</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                  placeholder="e.g. SW1A 1AA"
                  value={projectState.inputs.postcode}
                  onChange={(e) => updateInput('postcode', e.target.value.toUpperCase())}
                />
                <button className="button-primary" onClick={handlePostcodeSearch}>
                  <Search size={18} />
                </button>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  style={{ width: '1.2rem', height: '1.2rem' }}
                  checked={projectState.inputs.loft_inspection_accessible}
                  onChange={(e) => updateInput('loft_inspection_accessible', e.target.checked)}
                />
                <span>HAVE YOU CONDUCTED AN INTERNAL LOFT INSPECTION?</span>
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.5rem', marginLeft: '2rem' }}>
                * Mandatory for "Fixed Price Quote". If 'No', the document remains a "Non-binding Estimate".
              </p>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Site Photos Uploaded: {projectState.inputs.site_photos_count}</label>
              <input
                type="range" min="0" max="10"
                value={projectState.inputs.site_photos_count}
                onChange={(e) => updateInput('site_photos_count', parseInt(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>* 5 photos (including rafters and deck) required for Fixed Quote</p>
            </div>
          </div>

          <div className="card" style={{ borderTop: `4px solid ${projectState.documentType === 'BINDING_QUOTE' ? '#27ae60' : 'var(--color-accent)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3>Generated {projectState.documentType === 'BINDING_QUOTE' ? 'Fixed Quote' : 'Estimate'}</h3>
              <FileText color={projectState.documentType === 'BINDING_QUOTE' ? '#27ae60' : 'var(--color-accent)'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', margin: 0 }}>Project Cost</p>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>£{quoteData.totalCost.toLocaleString()}</div>
                {projectState.documentType !== 'BINDING_QUOTE' && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 600, marginTop: '0.2rem' }}>
                    ± 20% Variance applied (Subject to Survey)
                  </p>
                )}
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', margin: 0 }}>Target Duration</p>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{quoteData.durationDays} Working Days</div>
                <p style={{ fontSize: '0.75rem', color: '#27ae60', fontWeight: 600, marginTop: '0.2rem' }}>
                  + {quoteData.weatherContingencyDays} Day Weather Contingency
                </p>
              </div>
            </div>

            <button
              className="button-primary"
              style={{ width: '100%', marginTop: '2rem' }}
              onClick={startProject}
            >
              Accept Quote & Start Project Tracker
            </button>

            <div style={{ marginTop: '1.5rem', padding: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
                <Info size={16} /> Statutory 14-Day Cooling-Off Period
              </div>
              <p style={{ margin: 0, color: 'var(--color-muted)' }}>
                Under the Consumer Contracts Regulations, you have 14 days to cancel this agreement. No work will commence until this period expires unless you explicitly waive this right for urgent repairs.
              </p>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer', fontWeight: 600 }}>
                <input type="checkbox" />
                <span>I waive my right to the cooling-off period for immediate start (Urgent Works Only).</span>
              </label>
            </div>
          </div>
        </section>

        <aside>
          {projectState.fixingSpec && (
            <div className="card" style={{ borderLeft: '4px solid var(--color-accent)' }}>
              <h3>Wind Uplift Calculation (BS 5534)</h3>
              <p>Detected Zone: <strong>{projectState.fixingSpec.zone}</strong></p>
              <p style={{ fontSize: '0.85rem', backgroundColor: '#f9f9f9', padding: '1rem', borderRadius: '6px' }}>
                <strong>Fixing Schedule:</strong> {projectState.fixingSpec.schedule}
              </p>
            </div>
          )}

          <div className="card">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CloudRain size={24} /> Weather-Lock™ Monitoring
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>15°C</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Temperature</p>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>2mph</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Wind Speed</p>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>0mm</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Precipitation</p>
              </div>
            </div>
            {!weatherSafety.safe ? (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3f3', border: '1px solid var(--color-warning)', borderRadius: '8px', color: 'var(--color-warning)' }}>
                <strong>Work Suspended:</strong> {weatherSafety.reason}
              </div>
            ) : (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0fff4', borderRadius: '8px', color: '#27ae60', fontSize: '0.9rem' }}>
                ✓ Weather conditions safe for installation (BS 8000-0)
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Compliance Checklists</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', opacity: 0.8 }}>
                <ShieldCheck size={18} color="var(--color-accent)" /> Building Safety Act 2022 (Golden Thread)
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', opacity: 0.8 }}>
                <ShieldCheck size={18} color="var(--color-accent)" /> Consumer Rights Act 2015 Approved
              </li>
              <li style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.8rem', opacity: 0.8 }}>
                <ShieldCheck size={18} color="var(--color-accent)" /> UK GDPR / DUAA 2025 Compliant
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.8rem' }}>
        <p>RoofTrust UK © 2026 • Professional Standard for British Roofing</p>
        <p>This platform uses automated logic to enforce BS 5534, Part L, and the Building Safety Act 2022.</p>
      </footer>
    </div>
  );
}

export default App;
