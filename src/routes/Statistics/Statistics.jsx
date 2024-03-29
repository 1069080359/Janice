import React from 'react';
import * as XLSX from 'xlsx';
import ExportJsonExcel from 'js-export-excel';
import ReactHTMLTableToExcel from 'react-html-table-to-excel';
import moment from 'moment';
import {
  ConfigProvider,
  message,
  Table,
  Input,
  Button,
  Space,
  Affix,
  Tooltip
} from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
import zhCN from 'antd/es/locale/zh_CN';
import raintools from 'raintools';
import {
  formatBytes,
  trim,
  chromeSpeak
} from '../../utils/encapsulationMethod.js';
import styles from './Statistics.css';

class Statistics extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      loveYou: sessionStorage.getItem('loveYou'),
      loading: false,
      bfExcelData: [],
      afExcelData: [],
      filesInfo: {},
      searchText: '',
      searchedColumn: '',
      sheetFilterHeader: ['型号', '数量', '品牌', '单价', '重复次数'],
      sheetColumnWidths: ['10', '5', '10', '5', '5'],
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
          render: (num, row, index) => {
            return (
              <span className={styles.numberColor}>{num}</span>
            )
          }
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
        {
          title: '重复次数',
          dataIndex: 'frequency',
          key: 'frequency',
          align: 'center',
          sorter: (a, b) => a.frequency - b.frequency,
          render: (num, row, index) => {
            return (
              <>
                <span className={styles.frequencyColor}>{num} </span>次
              </>
            )
          }
        },
      ]
    };
  }

  componentDidMount() {
    console.log('raintools',raintools);
    console.log('uuid',raintools.uuid());
    const tableNode = document.getElementsByTagName('table')[0]
    tableNode && tableNode.setAttribute('id', 'table-to-xls')
    chromeSpeak('Welcome to 欢欢老婆 exclusive table summary tool')
  }

  // excel 上传
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

  // 对表格中的数据进行处理
  statisticalCalculation = (data) => {
    // 数据的整理筛选
    const list = data.reduce((listArr, item, index) => {
      // 将列表数据的 key 替换
      let obj = {
        price: item["单价"],
        brand: item['品牌'],
        model: trim(String(item['型号'])),
        number: item['数量'],
        frequency: 1,
        key: index.toString()
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
      chromeSpeak('i love you')
      message.success('文件上传解析成功');
    })
  }

  // 全部数据导出 Excel 表格
  downloadExcel = () => {
    const {
      afExcelData,
      filesInfo,
      sheetFilterHeader,
      sheetColumnWidths
    } = this.state
    if (afExcelData.length === 0) {
      message.warning('上传 Excel表格 哟，宝贝～');
      return false
    }
    let option = {};
    let dataTable = [];
    for (let i in afExcelData) {
      const {
        model,
        number,
        brand,
        price,
        frequency
      } = afExcelData[i]
      let obj = {
        '型号': model,
        '数量': number,
        '品牌': brand,
        '单价': price,
        '重复次数': frequency,
      }
      dataTable.push(obj);
    }

    option.fileName = `整理后 - ${filesInfo.name.split('.')[0]}`
    option.datas = [
      {
        sheetData: dataTable,
        sheetName: 'sheet',
        sheetFilter: sheetFilterHeader,
        sheetHeader: sheetFilterHeader,
        columnWidths: sheetColumnWidths
      }
    ];

    let toExcel = new ExportJsonExcel(option);
    toExcel.saveExcel();
  }

  // table 筛选
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

  renderTableHeader = () => {
    const {
      bfExcelData,
      afExcelData,
      filesInfo
    } = this.state
    return (
      <div className={styles.tableHeader}>
        <p>
          上传数据总数：<span className={styles.numberColor}>{bfExcelData.length}</span> 条
        </p>
        <p>
          汇总后总数：<span className={styles.numberColor}>{afExcelData.length}</span> 条
        </p>
        <p>
          文件名称：<span className={styles.numberColor}>{filesInfo.name}</span>
        </p>
        <p>
          文件大小：<span className={styles.numberColor}>{formatBytes(filesInfo.size)}</span>
        </p>
        <p>
          文档最后修改时间：<span className={styles.numberColor}>{moment(filesInfo.lastModified).format('YYYY-MM-DD HH:mm:ss')}</span>
        </p>
      </div>
    )
  }

  renderLine = () => <div className={styles.line} />

  // 彩蛋
  renderColoredEggs = () => {
    return (
      <Affix style={{ position: 'absolute', top: 120, right: 0 }}>
        <ul className={styles.ul}>
          <li>
            <a href="https://1069080359.github.io/Christmas-confession" target="_blank" rel="noopener noreferrer">圣诞节快乐</a>
          </li>
          {this.renderLine()}
          <li>
            <a href="https://1069080359.github.io/I-LOVE-YOU" target="_blank" rel="noopener noreferrer">I LOVE YOU</a>
          </li>
        </ul>
      </Affix>
    )
  }

  renderUpload = () => (
    <>
      <h1 className={styles.statisticsTitle}>表格汇总工具 --- 老婆专属</h1>
      <div className={styles.uploadBox}>
        <div className={styles.uploadFont}>
          <p className={styles.add}> </p>
          <p className={styles.uploadText}>单击或拖动文件到此区域以上传</p>
          <p className={styles.uploadHint}>暂时只支持单次上传</p>
        </div>
        <input type='file' accept='.xlsx, .xls' onChange={this.onImportExcel} className={styles.uploadInput} />
      </div>
    </>
  )

  renderTable = _ => {
    const {
      afExcelData,
      columns,
      loading
    } = this.state
    return (
      <ConfigProvider locale={zhCN}>
        <Table
          columns={columns}
          dataSource={afExcelData}
          bordered
          title={afExcelData.length !== 0 && this.renderTableHeader}
          loading={loading}
          size="middle"
          footer={() => '注意⚠️ Excel 表格内容有上传需求限制：型号, 数量, 品牌, 单价，不得包含其他类型，以及这四种名称不得改变'}
        />
      </ConfigProvider>
    )
  }

  renderBtn = () => (
    <Tooltip placement="topRight" title='支持排序、筛选后导出'>
      <Button>
        <span className={styles.fontTip}>当前页数据</span> 导出 Excel 表格
      </Button>
    </Tooltip>
  )
  renderDownloadExcel = () => {
    const {
      filesInfo
    } = this.state
    const fName = `整理后 - ${filesInfo?.name?.split('.')[0]}`
    return (
      <div className={styles.downloadExcelBox}>
        <Tooltip placement="topLeft" title='不支持排序、筛选后导出'>
          <Button onClick={this.downloadExcel}>
            <span className={styles.fontTip}>全部数据</span> 导出 Excel 表格
          </Button>
        </Tooltip>
        <ReactHTMLTableToExcel
          id="test-table-xls-button"
          className={styles.downloadTableXlsButton}
          table="table-to-xls"
          filename={fName}
          sheet={filesInfo?.name || ''}
          buttonText={this.renderBtn()} />
      </div>
    )
  }

  renderTrendsBg = () => {
    return (
      <div className={styles.trendsBgBox}>
        {
          this.renderUpload()
        }
        <div className={styles.trendsBgDiv}></div>
        <div className={styles.trendsBgDiv}></div>
        <div className={styles.trendsBgDiv}></div>
        <div className={styles.trendsBgDiv}></div>
        <div className={styles.trendsBgDiv}></div>
        <div className={styles.trendsBgDiv}></div>
      </div>
    )
  }

  render() {
    const { loveYou } = this.state
    const hasLoveYou = loveYou === '赵雨' || loveYou === '曹泽颖'
    return (
      <>
        {
          hasLoveYou && this.renderColoredEggs()
        }
        <div className={styles.statistics}>
          {
            this.renderTrendsBg()
          }
          {
            this.renderDownloadExcel()
          }
          {
            this.renderTable()
          }
        </div>
      </>
    )
  }

}

export default Statistics;
