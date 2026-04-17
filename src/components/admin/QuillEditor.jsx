import { useEffect, useRef } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ align: [] }],
  ['link', 'image'],
  ['clean'],
]

export function QuillEditor({ value, onChange, placeholder = 'Nhập nội dung...' }) {
  const rootRef = useRef(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (!rootRef.current || editorRef.current) return
    const quill = new Quill(rootRef.current, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: TOOLBAR_OPTIONS,
      },
    })
    editorRef.current = quill
    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value)
    }
    quill.on('text-change', () => {
      onChange?.(quill.root.innerHTML)
    })
  }, [onChange, placeholder, value])

  useEffect(() => {
    const quill = editorRef.current
    if (!quill) return
    const current = quill.root.innerHTML
    if ((value || '') !== current) {
      quill.clipboard.dangerouslyPasteHTML(value || '')
    }
  }, [value])

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div ref={rootRef} className="min-h-[240px]" />
    </div>
  )
}
