import React from 'react';
import * as XLSX from 'xlsx';
import { ConfigProvider, message, Table } from 'antd';
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
      columns: [
        {
          title: '型号',
          dataIndex: 'model',
          key: 'model',
          align: 'center'
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
    // 数据的整理
    const list = data.reduce((arr, item) => {
      let obj = {
        price: item["单价"],
        brand: item['品牌'],
        model: this.trim(String(item['型号'])),
        number: item['数量']
      }
      arr.push(obj)
      return arr
    }, [])
    // 数据的筛选
    const list2 = list.reduce((obj, item) => {
      let find = obj.find(i => (i.model === item.model) && !item.number)
      let _d = {
        ...item,
        frequency: 1
      }
      if (!item.number) {
        _d.number = 0
      }
      // eslint-disable-next-line no-unused-expressions
      find ? (find.number += item.number, find.frequency++) : obj.push(_d)
      return obj
    }, [])
    this.setState({
      bfExcelData: list,
      afExcelData: list2,
      loading: false
    }, () => {
      message.success('文件上传解析成功');
    })
  }

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
