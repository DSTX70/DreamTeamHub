import React from 'react'

export function CsvErrorModal({ open, onClose, errors }:{ open:boolean, onClose:()=>void, errors:{ line:number, message:string }[] }){
  if(!open) return null
  return (
    <div style={{position:'fixed',inset:0,display:'grid',placeItems:'center',background:'#0008',zIndex:50}} role="dialog" aria-modal="true">
      <div style={{background:'#0f1422',border:'1px solid #26304d',borderRadius:12,width:'min(720px,92vw)',maxHeight:'80vh',overflow:'auto'}}>
        <div style={{padding:'14px 16px',borderBottom:'1px solid #26304d'}}>
          <b>CSV Import — Review Errors</b>
        </div>
        <div style={{padding:16}}>
          {errors.length===0 ? <div>No errors 🎉</div> : (
            <ul style={{margin:0,paddingLeft:18}}>
              {errors.map((e,i)=>(<li key={i}><code>Line {e.line}:</code> {e.message}</li>))}
            </ul>
          )}
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',gap:8,padding:'12px 16px',borderTop:'1px solid #26304d'}}>
          <button className="btn btn--secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
