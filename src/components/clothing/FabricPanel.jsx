
import React,{useState} from "react"

import {FABRIC_LIBRARY} from "../../mesh/clothing/FabricPresets.js"
import {applyFabricToClothState} from "../../mesh/clothing/FabricPresets.js"

export default function FabricPanel({clothStateRef,setStatus}){

  const [selected,setSelected]=useState("cotton")

  const applyFabric=()=>{

    applyFabricToClothState(
      clothStateRef.current,
      selected
    )

    setStatus("fabric applied: "+selected)
  }

  return(

    <div className="fabric-panel">

      <h4>Fabric Library</h4>

      <select
        value={selected}
        onChange={e=>setSelected(e.target.value)}
      >

        {Object.keys(FABRIC_LIBRARY).map(f=>
          <option key={f}>{f}</option>
        )}

      </select>

      <button onClick={applyFabric}>
        apply fabric
      </button>

    </div>
  )
}
