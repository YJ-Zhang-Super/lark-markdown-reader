import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { bitable, ITextField } from '@lark-base-open/js-sdk';
import { Alert, AlertProps, Spin, Typography, Button, Modal } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github.css';
import './styles.css';

const { Title, Text } = Typography;

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MarkdownReader />
  </React.StrictMode>
)

function MarkdownReader() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldId, setFieldId] = useState<string | null>(null);
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  useEffect(() => {
    const initializePlugin = async () => {
      try {
        // 获取当前选中的字段
        const selection = await bitable.base.getSelection();
        if (!selection.fieldId) {
          setError('请选择一个文本字段');
          setLoading(false);
          return;
        }
        
        setFieldId(selection.fieldId);
        
        // 获取字段信息
        const table = await bitable.base.getActiveTable();
        const field = await table.getFieldById(selection.fieldId);
        const fieldMeta = await field.getMeta();
        
        // 检查字段类型是否为文本
        if (fieldMeta.type !== 'Text') {
          setError('请选择文本类型的字段');
          setLoading(false);
          return;
        }
        
        // 获取单元格内容
        if (selection.recordId) {
          const textField = field as ITextField;
          const cellValue = await textField.getValue(selection.recordId);
          if (cellValue) {
            setMarkdownContent(cellValue.toString());
          }
        }
        
        // 监听单元格内容变化
        bitable.base.onSelectionChange(async (event) => {
          if (event.data.fieldId && event.data.recordId) {
            const newField = await table.getFieldById(event.data.fieldId);
            const newFieldMeta = await newField.getMeta();
            
            if (newFieldMeta.type === 'Text') {
              setFieldId(event.data.fieldId);
              const textField = newField as ITextField;
              const cellValue = await textField.getValue(event.data.recordId);
              if (cellValue) {
                setMarkdownContent(cellValue.toString());
              } else {
                setMarkdownContent('');
              }
            }
          }
        });
        
        setLoading(false);
      } catch (err) {
        console.error('初始化插件失败:', err);
        setError('初始化插件失败，请刷新页面重试');
        setLoading(false);
      }
    };
    
    initializePlugin();
  }, []);
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <Spin tip="加载中..." />
      </div>
    );
  }
  
  if (error) {
    return <Alert message={error} type="error" />;
  }
  
  return (
    <div className="markdown-reader-container">
      <div className="markdown-header">
        <Title level={4}>Markdown 阅读器</Title>
        <Button type="primary" onClick={toggleFullscreen}>
          {isFullscreen ? '退出全屏' : '全屏查看'}
        </Button>
      </div>
      
      <div className={`markdown-content ${isFullscreen ? 'fullscreen' : ''}`}>
        {markdownContent ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, rehypeHighlight]}
          >
            {markdownContent}
          </ReactMarkdown>
        ) : (
          <Text type="secondary">选择一个包含 Markdown 内容的单元格</Text>
        )}
      </div>
      
      <Modal
        title="Markdown 全屏预览"
        open={isFullscreen}
        onCancel={toggleFullscreen}
        footer={null}
        width="80%"
        bodyStyle={{ maxHeight: '80vh', overflow: 'auto' }}
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
        >
          {markdownContent}
        </ReactMarkdown>
      </Modal>
    </div>
  );
}
