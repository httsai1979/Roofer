import React, { useState } from 'react';
import { useWorkflow } from './hooks/useWorkflow';
import { TERMINOLOGY } from './constants/terminology';
import { FileText, ShieldCheck, CloudRain, Info, Search, UserPlus, CheckCircle, AlertTriangle, CreditCard, Download, Mail, ChevronRight, HardHat, Camera, Hammer } from 'lucide-react';

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
    generateHandoverPack,
    sendHandoverEmail,
    requestFinalPayment,
    resetProject,
    applyVariation,
    updateVariationStatus,
    uploadCredential
  } = useWorkflow();

  const [onboardingForm, setOnboardingForm] = useState({ name: '', registration_number: '' });
  const [variationForm, setVariationForm] = useState({ reason: '', cost: '', photoUrl: null });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const handlePostcodeSearch = () => {
    if (projectState.inputs.postcode) {
      calculateWindUplift(projectState.inputs.postcode);
    }
  };

  const weatherSafety = checkWeatherSafety();
  const quoteData = calculateEstimate();

  // --- RENDERING LOGIC ---

  // Phase 0: Onboarding / Login (Contractor side)
  if (!projectState.contractor.onboardingCompleted) {
    return (
      <div className="roof-trust-container">
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1>RoofTrust <span style={{ color: 'var(--color-accent)' }}>UK</span></h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem' }}>The Professional Standard for British Roofing</p>
        </header>

        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ backgroundColor: '#f0f7ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <UserPlus color="#3498db" />
            </div>
            <h2>Contractor Registration</h2>
            <p style={{ color: 'var(--color-muted)' }}>Join the UK's most transparent roofing platform.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); completeOnboarding(onboardingForm); }}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Business Name</label>
              <input
                type="text" required className="input-field"
                value={onboardingForm.name}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, name: e.target.value })}
                placeholder="e.g. Traditional Roofing Ltd"
              />
            </div>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Registration Number</label>
              <input
                type="text" required className="input-field"
                value={onboardingForm.registration_number}
                onChange={(e) => setOnboardingForm({ ...onboardingForm, registration_number: e.target.value })}
                placeholder="NFRC-XXXXX or CompetentRoofer"
              />
            </div>
            <button type="submit" className="button-primary" style={{ width: '100%' }}>
              Register & Continue <ChevronRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Phase 2: Live Tracking
  if (projectState.phase === 'phase_2_tracking') {
    const hasTodayLog = projectState.project.dailyLogs.some(log => log.date === new Date().toLocaleDateString());
    const hoursSinceUpdate = projectState.project.lastUpdateTimestamp ? (Date.now() - projectState.project.lastUpdateTimestamp) / 3600000 : 0;
    const isOverdue = hoursSinceUpdate > 48;
    const allChecked = projectState.project.completionChecklist.every(item => item.checked);
    const finalBalanceReleased = projectState.project.paymentStages.find(s => s.id === 'final').status === 'released';
    const canReleaseFinal = allChecked && projectState.project.handoverPackSent && projectState.project.finalPaymentRequested;

    return (
      <div className="roof-trust-container">
        <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1>Live Project Tracker</h1>
            <p style={{ color: 'var(--color-muted)', margin: 0 }}>Project #RT-{Date.now().toString().slice(-6)} • Professional Audit Active</p>
          </div>
          <div className="badge badge-success">In Progress</div>
        </header>

        {isOverdue && (
          <div className="card" style={{ background: '#fff5f5', border: '1px solid #feb2b2' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <AlertTriangle color="#c53030" size={32} />
              <div>
                <h3 style={{ color: '#c53030', margin: 0 }}>Contractor Update Overdue</h3>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.95rem' }}>No project photos or logs received in the last 48 hours. An automated delay notification has been logged.</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '2rem' }}>
          <main>
            {/* Payment Section */}
            <section className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}><CreditCard /> Payment & Escrow Status</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', textAlign: 'right' }}>
                  Original (£{quoteData.baseCost.toLocaleString()})
                  {quoteData.approvedVariationCost > 0 && ` + Approved VO (£${quoteData.approvedVariationCost.toLocaleString()})`} =
                  <strong> £{quoteData.totalCost.toLocaleString()}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projectState.project.paymentStages.map((stage) => (
                  <div key={stage.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: stage.status === 'released' ? '#f0fff4' : '#f8fafc', borderRadius: '12px', border: '1px solid #edf2f7' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{stage.label}</div>
                      <div style={{ color: 'var(--color-primary)', fontWeight: 600 }}>£{(quoteData.totalCost * (stage.percent / 100)).toFixed(2).toLocaleString()}</div>
                    </div>
                    {stage.status === 'released' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontWeight: 700 }}>
                        <CheckCircle size={18} /> RELEASED
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <button
                          className="button-primary"
                          disabled={stage.id === 'final' && !canReleaseFinal}
                          onClick={() => releasePayment(stage.id)}
                          style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}
                        >
                          {stage.id === 'final' && !canReleaseFinal ? 'Locked' : 'Release Funds'}
                        </button>
                        {stage.id === 'final' && canReleaseFinal && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-muted)', textAlign: 'right', maxWidth: '180px' }}>
                            * Clicking confirms satisfaction with works and receipt of warranty pack.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', padding: '1.2rem', background: '#fffbeb', borderRadius: '12px', border: '1px solid #fef3c7' }}>
                <Info size={24} color="#92400e" style={{ flexShrink: 0 }} />
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#92400e' }}>
                  <strong>Consumer Protection:</strong> Under the Consumer Rights Act 2015, payments are held in escrow until key milestones are reached. Do not release final funds until you are satisfied with the completion audit.
                </p>
              </div>
            </section>

            {/* Checklist Section */}
            <section className="card" style={{ background: '#f8fafc' }}>
              <h2><CheckCircle /> Final Inspection Checklist</h2>
              <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>Please verify these items personally before releasing the final 30% balance.</p>
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {projectState.project.completionChecklist.map((item) => (
                  <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'white', borderRadius: '12px', border: '1px solid #eee', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={(e) => updateChecklist(item.id, e.target.checked)}
                      style={{ width: '1.4rem', height: '1.4rem' }}
                    />
                    <span style={{ fontWeight: 600 }}>{item.label}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Variations Section */}
            <section className="card variation-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2><AlertTriangle /> Variation Orders (Project Changes)</h2>
                <div className="badge badge-warning">New Request Ability</div>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--color-muted)' }}>If the contractor discovers unexpected issues (e.g. decayed timber), they must submit a request for your approval here.</p>

              {/* Form for Contractor */}
              <div style={{ margin: '1.5rem 0', padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px dashed var(--color-accent)' }}>
                <h4 style={{ marginBottom: '1rem' }}>Submit New Variation (Contractor Only)</h4>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input
                    type="text" className="input-field" placeholder="Reason (e.g. Replacement of 5 rotten batten lengths)"
                    value={variationForm.reason} onChange={(e) => setVariationForm({ ...variationForm, reason: e.target.value })}
                  />
                  <input
                    type="number" className="input-field" placeholder="Cost (£)" style={{ maxWidth: '120px' }}
                    value={variationForm.cost} onChange={(e) => setVariationForm({ ...variationForm, cost: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    className="button-primary"
                    style={{ flex: 1, background: variationForm.photoUrl ? 'var(--color-success)' : 'white', color: variationForm.photoUrl ? 'white' : 'var(--color-primary)', border: '1px dashed var(--color-primary)' }}
                    onClick={() => setVariationForm({ ...variationForm, photoUrl: 'https://images.unsplash.com/photo-1632759162353-19c9a07a0dfc?auto=format&fit=crop&q=80&w=200' })}
                  >
                    <Camera size={18} /> {variationForm.photoUrl ? 'Proof Photo Attached ✓' : 'Upload Proof Photo (Required)'}
                  </button>
                  <button
                    className="button-primary"
                    disabled={!variationForm.reason || !variationForm.cost || !variationForm.photoUrl}
                    style={{ flex: 1 }}
                    onClick={() => {
                      applyVariation(variationForm.reason, parseFloat(variationForm.cost), variationForm.photoUrl);
                      setVariationForm({ reason: '', cost: '', photoUrl: null });
                    }}
                  >
                    Submit Variation Request
                  </button>
                </div>
              </div>

              {/* List for Homeowner */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(projectState.project.variations || []).map(v => (
                  <div key={v.id} style={{ padding: '1.2rem', background: v.status === 'approved' ? '#f0fff4' : '#fff', borderRadius: '12px', border: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      {v.photoUrl && (
                        <div style={{ width: '40px', height: '40px', background: '#eee', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={v.photoUrl} alt="proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 700 }}>£{v.extraCost.toLocaleString()} — {v.reason}</div>
                        <div className="badge" style={{ marginTop: '0.4rem', fontSize: '0.7rem', display: 'inline-block' }}>{v.status.replace('_', ' ').toUpperCase()}</div>
                      </div>
                    </div>
                    {v.status === 'pending_approval' && (
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button className="button-primary" style={{ background: 'var(--color-success)', padding: '0.5rem 1rem' }} onClick={() => updateVariationStatus(v.id, 'approved')}>Approve</button>
                        <button className="button-primary" style={{ background: 'var(--color-warning)', padding: '0.5rem 1rem' }} onClick={() => updateVariationStatus(v.id, 'rejected')}>Decline</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside>
            <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
              <h3 style={{ color: 'white' }}><HardHat /> Workday Log</h3>
              <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Select category and upload photo for the 'Golden Thread' audit.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="button-primary"
                  style={{ background: 'white', color: 'var(--color-primary)', fontSize: '0.75rem', padding: '0.5rem' }}
                  onClick={() => uploadDailyPhoto('Insulation_Check')}
                >
                  + Insulation
                </button>
                <button
                  className="button-primary"
                  style={{ background: 'white', color: 'var(--color-primary)', fontSize: '0.75rem', padding: '0.5rem' }}
                  onClick={() => uploadDailyPhoto('Structural_Fixing')}
                >
                  + Structural
                </button>
              </div>

              <button
                className="button-primary"
                style={{ width: '100%', background: 'white', color: 'var(--color-primary)', marginTop: '0.8rem' }}
                disabled={hasTodayLog}
                onClick={() => uploadDailyPhoto('General')}
              >
                <Camera size={18} /> {hasTodayLog ? 'Daily Log Verified ✓' : 'Upload General Photo'}
              </button>

              {hasTodayLog && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  ✓ Progress data successfully synced for {new Date().toLocaleDateString()}.
                </div>
              )}
            </div>

            <div className="card" style={{ backgroundColor: '#f8fafc' }}>
              <h3><Hammer size={20} /> Project Timeline</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Digital 'Golden Thread' record (BSA 2022)</p>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projectState.project.dailyLogs.length === 0 ? (
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem' }}>Awaiting first upload...</p>
                ) : (
                  projectState.project.dailyLogs.map((log, i) => (
                    <div key={i} className="timeline-item" style={{ padding: '1rem', gap: '0.8rem' }}>
                      <div style={{ width: '40px', height: '40px', background: '#edf2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Camera size={20} color="#718096" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{log.date}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-success)' }}>{log.tag}: {log.status}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {allChecked && !finalBalanceReleased && (
              <div className="card" style={{ background: '#f0fff4', border: '2px solid var(--color-success)' }}>
                <h3>Final Documentation</h3>
                <p style={{ fontSize: '0.9rem' }}>Handover pack is ready. Once sent by contractor, final payment can be released.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                  <button className="button-primary" onClick={() => {
                    const result = generateHandoverPack();
                    if (!result.success) {
                      alert(`Missing Statutory Evidence: Please upload photos for ${result.missing.join(', ')} before generating the pack.`);
                    }
                  }}><Download size={18} /> Generate Warranty Pack</button>
                  <button
                    className="button-primary"
                    disabled={!projectState.project.handoverPackGenerated}
                    style={{ background: 'var(--color-secondary)' }}
                    onClick={sendHandoverEmail}
                  >
                    <Mail size={18} /> Send to Homeowner
                  </button>
                </div>
                {projectState.project.handoverPackSent && (
                  <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button className="button-primary" onClick={requestFinalPayment} style={{ width: '100%', background: 'var(--color-accent)' }}>
                      Request Final Payment Release
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // Phase 1: Survey & Quoting
  return (
    <div className="roof-trust-container">
      {!projectState.contractor.isVerified && (
        <div style={{ background: '#fff5f5', padding: '1.2rem', borderRadius: '12px', border: '1px solid #feb2b2', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '2.5rem' }}>
          <AlertTriangle color="#c53030" size={24} />
          <div style={{ fontSize: '0.95rem', color: '#9b2c2c' }}>
            <strong>Consumer Notice:</strong> This contractor is completing manual verification. We recommend reviewing their physical certificates before starting work.
          </div>
        </div>
      )}

      <header style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Roof Health Check & Quote</h1>
          <p style={{ color: 'var(--color-muted)', fontSize: '1.1rem' }}>Professional Assessment for {projectState.contractor.name || 'Your Home'}</p>
        </div>
        <div className={`badge ${projectState.documentType === 'BINDING_QUOTE' ? 'badge-success' : 'badge-warning'}`}>
          {projectState.documentType === 'BINDING_QUOTE' ? 'Fixed Binding Quote' : 'Initial Estimate'}
        </div>
      </header>

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem' }}>
        <section>
          <div className="card">
            <h2>Project Specifications</h2>
            <div className="layman-tip">
              We use these numbers to calculate materials correctly. A Binding Quote requires an <strong>internal loft inspection</strong> to check the condition of your roof's foundation.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Building Height</label>
                <input type="number" className="input-field" value={projectState.inputs.building_height_meters} onChange={(e) => updateInput('building_height_meters', parseFloat(e.target.value))} />
                <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>Metres from ground to eaves</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Roof Steepness</label>
                <input type="number" className="input-field" value={projectState.inputs.roof_pitch_degrees} onChange={(e) => updateInput('roof_pitch_degrees', parseFloat(e.target.value))} />
                <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>Degrees (Pitch)</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Roof Area</label>
                <input type="number" className="input-field" value={projectState.inputs.roof_area_sqm} onChange={(e) => updateInput('roof_area_sqm', parseFloat(e.target.value))} />
                <p style={{ fontSize: '0.7rem', color: 'var(--color-muted)', marginTop: '0.4rem' }}>Square Metres (Total Size)</p>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 600 }}>Where is the work being done?</label>
              <div style={{ display: 'flex', gap: '0.8rem' }}>
                <input type="text" className="input-field" placeholder="Enter Postcode (e.g. SW1A 1AA)" value={projectState.inputs.postcode} onChange={(e) => updateInput('postcode', e.target.value.toUpperCase())} />
                <button className="button-primary" onClick={handlePostcodeSearch}><Search size={20} /></button>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.5rem' }}>* We check local wind speeds to ensure your roof is fixed to BS 5534 standards.</p>
            </div>

            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #edf2f7' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={projectState.inputs.loft_inspection_accessible} onChange={(e) => updateInput('loft_inspection_accessible', e.target.checked)} style={{ width: '1.4rem', height: '1.4rem' }} />
                <span style={{ fontWeight: 700 }}>Internal Inspection Conducted?</span>
              </label>
              <div style={{ fontSize: '0.9rem', color: 'var(--color-muted)', marginTop: '0.5rem', paddingLeft: '2.4rem' }}>
                Checking the timber beams from the inside prevents hidden costs later. Required for a <strong>Fixed Price Guarantee</strong>.
              </div>
            </div>
          </div>

          <div className="card" style={{ borderTop: `6px solid ${projectState.documentType === 'BINDING_QUOTE' ? 'var(--color-success)' : 'var(--color-accent)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ marginBottom: '0.5rem' }}>{projectState.documentType === 'BINDING_QUOTE' ? 'Your Fixed Quote' : 'Your Professional Estimate'}</h2>
                <div className="badge badge-success">Valid for 30 Days</div>
              </div>
              <ShieldCheck size={40} color={projectState.documentType === 'BINDING_QUOTE' ? 'var(--color-success)' : 'var(--color-accent)'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', margin: '2.5rem 0' }}>
              <div>
                <div style={{ fontSize: '1rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Full Project Cost (Incl. Labour)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>£{quoteData.totalCost.toLocaleString()}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.2rem' }}>
                  Original: £{quoteData.baseCost.toLocaleString()}
                  {quoteData.approvedVariationCost > 0 && ` + Variations: £${quoteData.approvedVariationCost.toLocaleString()}`}
                </div>
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: projectState.documentType === 'BINDING_QUOTE' ? 'var(--color-success)' : 'var(--color-warning)', fontWeight: 600 }}>
                  {projectState.documentType === 'BINDING_QUOTE' ? '✓ Price Locked' : '⚠ Subject to Survey Variance (±20%)'}
                </p>
              </div>
              <div>
                <div style={{ fontSize: '1rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>Expected Completion</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800 }}>{quoteData.durationDays} Days</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>+ {quoteData.weatherContingencyDays} Days Weather Safety Buffer</div>
              </div>
            </div>

            <button className="button-primary" style={{ width: '100%', padding: '1.2rem', fontSize: '1.2rem' }} onClick={() => setShowConfirmModal(true)}>
              Accept & Begin Live Tracking <ChevronRight size={24} />
            </button>

            {/* Confirmation Modal Overlay */}
            {showConfirmModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(27, 48, 34, 0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 1000, padding: '1rem'
              }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                  <ShieldCheck size={48} color="var(--color-primary)" style={{ margin: '0 auto 1rem' }} />
                  <h2>Bilateral Agreement</h2>
                  <p style={{ color: 'var(--color-muted)', fontSize: '0.95rem', textAlign: 'left', background: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
                    I hereby accept the {projectState.documentType === 'BINDING_QUOTE' ? 'Fixed Binding Quote' : 'Project Estimate'} of <strong>£{quoteData.totalCost.toLocaleString()}</strong>.
                    <br /><br />
                    I understand that any "Variation Orders" (unexpected work) found during construction will be submitted as separate requests and will require my explicit digital approval prior to any price adjustment.
                  </p>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 0', cursor: 'pointer', textAlign: 'left' }}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      style={{ width: '1.5rem', height: '1.5rem' }}
                    />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      I agree to the Digital Work Authorization and CRA 2015 Terms.
                    </span>
                  </label>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      className="button-primary"
                      style={{ flex: 1, background: '#cbd5e0', color: '#4a5568' }}
                      onClick={() => setShowConfirmModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="button-primary"
                      style={{ flex: 1 }}
                      disabled={!agreedToTerms}
                      onClick={() => {
                        startProject();
                        setShowConfirmModal(false);
                      }}
                    >
                      Confirm Agreement
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #eee', marginTop: '2rem', paddingTop: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.8rem' }}>
                <CloudRain size={20} color="var(--color-primary)" />
                <span style={{ fontWeight: 700 }}>Built-in Consumer Protection</span>
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', margin: 0 }}>
                You have a statutory 14-day cooling-off period. Our Weather-Lock™ system will monitor your local conditions to ensure materials are only laid in optimal weather.
              </p>
            </div>
          </div>
        </section>

        <aside>
          <div className="card" style={{ background: '#f8fafc' }}>
            <h3 style={{ marginBottom: '1.2rem' }}>Safety & Standards</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #edf2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CloudRain color="var(--color-primary)" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>BS 5534 Compliance</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Calculation logic based on local wind speeds (Wind Zone {projectState.fixingSpec?.zone || 'TBC'}).</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', background: 'white', border: '1px solid #edf2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard color="var(--color-primary)" size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>Protected Payments</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Funds held securely. Releases split 30% / 40% / 30% for your safety.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ background: 'var(--color-primary)', color: 'white' }}>
            <h3 style={{ color: 'white' }}>Why Choose This Quote?</h3>
            <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>Every project on RoofTrust includes:</p>
            <ul style={{ paddingLeft: '1.2rem', margin: '1rem 0', fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '0.6rem' }}>15-Year Golden Thread Audit</li>
              <li style={{ marginBottom: '0.6rem' }}>BS 5534 Fixing Schedule</li>
              <li style={{ marginBottom: '0.6rem' }}>Live Daily Progress Photos</li>
              <li>Handover Compliance Pack</li>
            </ul>
          </div>

          <button
            onClick={resetProject}
            style={{ width: '100%', background: 'none', border: '1px solid var(--color-border)', color: 'var(--color-muted)', padding: '0.8rem', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Clear Data & Start New Quote
          </button>
        </aside>
      </div>

      <footer style={{ marginTop: '4rem', paddingBottom: '3rem', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>
        <p>RoofTrust UK © 2026 • The Standard for British Roofing</p>
        <p>Consumer Rights Act 2015 & Building Safety Act 2022 Compliant Platform</p>
      </footer>
    </div>
  );
}

export default App;
