import { useMemo } from 'react';
import SimpleMdeReact from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';


const MarkdownEditor = ({ value, onChange, placeholder = 'Write your description...' }) => {
  const options = useMemo(() => ({
    placeholder,
    spellChecker: false,
    status: false,
    toolbar: [
      'bold',
      'italic',
      'heading',
      '|',
      'quote',
      'unordered-list',
      'ordered-list',
      '|',
      'link',
      'image',
      '|',
      'preview',
      'side-by-side',
      'fullscreen',
      '|',
      'guide',
    ],
    autofocus: false,
    minHeight: '200px',
  }), [placeholder]);

  return (
    <SimpleMdeReact
      value={value || ''}
      onChange={onChange}
      options={options}
    />
  );
};

export default MarkdownEditor;
