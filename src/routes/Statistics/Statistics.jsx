import React from 'react';
import * as XLSX from 'xlsx';
import { ConfigProvider, message, Table, Input, Button, Space } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import styles from './Statistics.css';

class Statistics extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      bfExcelData: [],
      afExcelData: [],
      filesInfo: {},
      searchText: '',
      searchedColumn: '',
      columns: [
        {
          title: '型号',
          dataIndex: 'model',
          key: 'model',
          align: 'center',
          ...this.getColumnSearchProps('model')
        },
        {
          title: '数量',
          dataIndex: 'number',
          key: 'number',
          align: 'center',
          sorter: (a, b) => a.number - b.number,
        },
        {
          title: '品牌',
          dataIndex: 'brand',
          key: 'brand',
          align: 'center'
        },
        {
          title: '单价',
          dataIndex: 'price',
          key: 'price',
          align: 'center'
        },
      ]
    };
  }

  formatBytes = (bytes, decimals) => {
    if (bytes === 0) return '0 Bytes';
    var k = 1024,
      dm = decimals || 2,
      sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
      i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  onImportExcel = file => {
    // 获取上传的文件对象
    const { files } = file.target;
    this.setState({
      filesInfo: files[0],
      loading: true
    })
    // 通过FileReader对象读取文件
    const fileReader = new FileReader();
    fileReader.onload = event => {
      try {
        const { result } = event.target;
        // 以二进制流方式读取得到整份excel表格对象
        const workbook = XLSX.read(result, { type: 'binary' });
        let data = []; // 存储获取到的数据
        // 遍历每张工作表进行读取（这里默认只读取第一张表）
        for (const sheet in workbook.Sheets) {
          if (workbook.Sheets.hasOwnProperty(sheet)) {
            // 利用 sheet_to_json 方法将 excel 转成 json 数据
            data = data.concat(XLSX.utils.sheet_to_json(workbook.Sheets[sheet]));
            // break; // 如果只取第一张表，就取消注释这行
          }
        }
        this.statisticalCalculation(data)
      } catch (e) {
        // 这里可以抛出文件类型错误不正确的相关提示
        message.warning('文件类型不正确');
        this.setState({ loading: false });
        return;
      }
    };
    // 以二进制方式打开文件
    fileReader.readAsBinaryString(files[0]);
    file.target.value = ""
  }

  trim = (s) => {
    return s.replace(/(^\s*)|(\s*$)/g, "");
  }

  statisticalCalculation = (data) => {
    // 数据的整理筛选
    const list = data.reduce((listArr, item) => {
      // 将列表数据的 key 替换
      let obj = {
        price: item["单价"],
        brand: item['品牌'],
        model: this.trim(String(item['型号'])),
        number: item['数量'],
        frequency: 1
      }
      // 判断 替换中的 数据中的 型号是否和 listArr 的型号是否有相同
      let find = listArr.find(i => obj.number && (i.model === obj.model))
      // 需要对替换的数据中的 数量 进行判断 如果是 undefined 则改为 0 否则会对排序有影响
      if (!obj.number) {
        obj.number = 0
      }
      // 最后 如果有相同的则 相加 数量，如果没有相同的 则 push 到 listArr
      // eslint-disable-next-line no-unused-expressions
      find ? (find.number += obj.number, find.frequency++) : listArr.push(obj)
      return listArr
    }, [])
    this.setState({
      bfExcelData: data,
      afExcelData: list,
      loading: false
    }, () => {
      message.success('文件上传解析成功');
    })
  }

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder='按下回车键即可搜索型号'
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            重制
          </Button>
        </Space>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
        : '',
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select(), 100);
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });



  renderTableHeader = () => {
    const {
      bfExcelData,
      afExcelData,
      filesInfo
    } = this.state
    return (
      <div className={styles.tableHeader}>
        <p>
          数据总数：{bfExcelData.length} 条
        </p>
        <p>
          汇总后数据总数：{afExcelData.length} 条
        </p>
        <p>
          文件名称：{filesInfo.name}
        </p>
        <p>
          文件大小：{this.formatBytes(filesInfo.size)}
        </p>
      </div>
    )
  }

  render() {
    const {
      afExcelData,
      columns,
      loading
    } = this.state
    return (
      <div className={styles.statistics}>
        <h1 className={styles.statisticsTitle}>表格汇总工具</h1>
        <div className={styles.uploadBox}>
          <div className={styles.uploadFont}>
            <p className={styles.add}> </p>
            <p className={styles.uploadText}>单击或拖动文件到此区域以上传</p>
            <p className={styles.uploadHint}>暂时只支持单次上传</p>
          </div>
          <input type='file' accept='.xlsx, .xls' onChange={this.onImportExcel} className={styles.uploadInput} />
        </div>
        <ConfigProvider locale={zhCN}>
          <Table
            columns={columns}
            dataSource={afExcelData}
            bordered
            title={afExcelData.length !== 0 && this.renderTableHeader}
            loading={loading}
            size="middle"
          // footer={() => 'Footer'}
          />
        </ConfigProvider>
      </div>
    )
  }

}

export default Statistics;
