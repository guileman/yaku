"""Paso 1 del pipeline: STEP (XCAF con nombres y colores) -> GLB crudo (OCCT RWGltf_CafWriter).
Uso: python3 step2glb.py entrada.stp salida_raw.glb [deflexion_mm]"""
import sys
from OCP.STEPCAFControl import STEPCAFControl_Reader
from OCP.TDocStd import TDocStd_Document
from OCP.TCollection import TCollection_ExtendedString, TCollection_AsciiString
from OCP.XCAFDoc import XCAFDoc_DocumentTool
from OCP.BRepMesh import BRepMesh_IncrementalMesh
from OCP.RWGltf import RWGltf_CafWriter
from OCP.collections import IndexedDataMap_TCollection_AsciiString_TCollection_AsciiString as InfoMap
from OCP.Message import Message_ProgressRange
from OCP.IFSelect import IFSelect_RetDone
src, dst = sys.argv[1], sys.argv[2]
lin = float(sys.argv[3]) if len(sys.argv) > 3 else 0.25
doc = TDocStd_Document(TCollection_ExtendedString("doc"))
r = STEPCAFControl_Reader(); r.SetColorMode(True); r.SetNameMode(True)
assert r.ReadFile(src) == IFSelect_RetDone
r.Transfer(doc)
st = XCAFDoc_DocumentTool.ShapeTool_s(doc.Main())
shape = st.GetOneShape()
BRepMesh_IncrementalMesh(shape, lin, False, 0.22, True)
w = RWGltf_CafWriter(TCollection_AsciiString(dst), True)
try:
    from OCP.RWMesh import RWMesh_CoordinateSystem
    w.ChangeCoordinateSystemConverter().SetInputLengthUnit(0.001)  # mm -> m
    w.ChangeCoordinateSystemConverter().SetInputCoordinateSystem(RWMesh_CoordinateSystem.RWMesh_CoordinateSystem_Zup)
except Exception as e:
    print("cs warn", e)
try:
    from OCP.RWMesh import RWMesh_NameFormat
    w.SetNodeNameFormat(RWMesh_NameFormat.RWMesh_NameFormat_InstanceOrProduct)
    w.SetMeshNameFormat(RWMesh_NameFormat.RWMesh_NameFormat_Product)
except Exception as e:
    print("name warn", e)
ok = w.Perform(doc, InfoMap(), Message_ProgressRange())
print("ok", ok)
