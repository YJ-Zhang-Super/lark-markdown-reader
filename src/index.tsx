import { FieldType, bitable, UIBuilder } from "@lark-base-open/js-sdk";
import { marked } from 'marked';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';

// Markdown 阅读器组件
const MarkdownReader: React.FC = () => {
  const [tables, setTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [fields, setFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<string>('');
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<string>('');
  const [markdownContent, setMarkdownContent] = useState<string>('');
  const [htmlContent, setHtmlContent] = useState<string>('');

  // 初始化获取所有表格
  useEffect(() => {
    const loadTables = async () => {
      try {
        const tableList = await bitable.base.getTableList();
        setTables(tableList);
        if (tableList.length > 0) {
          setSelectedTable(tableList[0].id);
        }
      } catch (error) {
        console.error('获取表格列表失败:', error);
      }
    };
    
    loadTables();
  }, []);

  // 当选择表格变化时，获取该表格的字段
  useEffect(() => {
    const loadFields = async () => {
      if (!selectedTable) return;
      
      try {
        const table = await bitable.base.getTableById(selectedTable);
        const fieldList = await table.getFieldList();
        // 只过滤出文本类型的字段，因为Markdown通常存储在文本字段中
        const textFields = fieldList.filter(field => 
          field.type === FieldType.Text || 
          field.type === FieldType.MultilineText
        );
        
        setFields(textFields);
        if (textFields.length > 0) {
          setSelectedField(textFields[0].id);
        } else {
          setSelectedField('');
          setMarkdownContent('当前表格没有文本类型字段');
        }
      } catch (error) {
        console.error('获取字段列表失败:', error);
      }
    };
    
    loadFields();
  }, [selectedTable]);

  // 当选择字段变化时，获取该字段的所有记录
  useEffect(() => {
    const loadRecords = async () => {
      if (!selectedTable || !selectedField) return;
      
      try {
        const table = await bitable.base.getTableById(selectedTable);
        const recordList = await table.getRecordList();
        setRecords(recordList);
        if (recordList.length > 0) {
          setSelectedRecord(recordList[0].id);
        } else {
          setSelectedRecord('');
          setMarkdownContent('当前表格没有记录');
        }
      } catch (error) {
        console.error('获取记录列表失败:', error);
      }
    };
    
    loadRecords();
  }, [selectedTable, selectedField]);

  // 当选择记录变化时，获取该记录的Markdown内容
  useEffect(() => {
    const loadMarkdownContent = async () => {
      if (!selectedTable || !selectedField || !selectedRecord) return;
      
      try {
        const table = await bitable.base.getTableById(selectedTable);
        const field = await table.getFieldById(selectedField);
        const cellValue = await table.getCellValue(selectedField, selectedRecord);
        
        if (cellValue) {
          setMarkdownContent(String(cellValue));
          // 将Markdown转换为HTML
          setHtmlContent(marked(String(cellValue)));
        } else {
          setMarkdownContent('');
          setHtmlContent('');
        }
      } catch (error) {
        console.error('获取单元格内容失败:', error);
      }
    };
    
    loadMarkdownContent();
  }, [selectedTable, selectedField, selectedRecord]);

  return (
    <div style={{ padding: '16px' }}>
      <h1>Markdown 阅读器</h1>
      
      <div style={{ marginBottom: '16px' }}>
        <label>选择表格: </label>
        <select 
          value={selectedTable} 
          onChange={(e) => setSelectedTable(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        >
          {tables.map(table => (
            <option key={table.id} value={table.id}>{table.name}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label>选择字段: </label>
        <select 
          value={selectedField} 
          onChange={(e) => setSelectedField(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        >
          {fields.map(field => (
            <option key={field.id} value={field.id}>{field.name}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <label>选择记录: </label>
        <select 
          value={selectedRecord} 
          onChange={(e) => setSelectedRecord(e.target.value)}
          style={{ width: '100%', padding: '8px', marginTop: '4px' }}
        >
          {records.map((record, index) => (
            <option key={record.id} value={record.id}>记录 {index + 1}</option>
          ))}
        </select>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <h2>Markdown 源码</h2>
        <div 
          style={{ 
            border: '1px solid #ccc', 
            padding: '8px', 
            borderRadius: '4px',
            backgroundColor: '#f5f5f5',
            whiteSpace: 'pre-wrap',
            maxHeight: '200px',
            overflowY: 'auto'
          }}
        >
          {markdownContent}
        </div>
      </div>
      
      <div>
        <h2>渲染结果</h2>
        <div 
          style={{ 
            border: '1px solid #ccc', 
            padding: '16px', 
            borderRadius: '4px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
};

// 插件入口
export default async function main(uiBuilder: UIBuilder) {
  uiBuilder.markdown(`
  # Markdown 阅读器
  
  这个插件可以读取多维表格中的 Markdown 内容并渲染显示。
  `);
  
  const container = document.createElement('div');
  uiBuilder.html(container);
  
  const root = ReactDOM.createRoot(container);
  root.render(React.createElement(MarkdownReader));
}
