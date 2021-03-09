import React from 'react';
import * as XLSX from 'xlsx';
import { message } from 'antd';
import styles from './Statistics.css';

class Statistics extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      bfExcelData: [],
      afExcelData: [],
      filesInfo: {}
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
      filesInfo: files[0]
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
        model: item['型号'],
        number: item['数量']
      }
      arr.push(obj)
      return arr
    }, [])
    // 数据的筛选
    const list2 = list.reduce((obj, item) => {
      let find = obj.find(i => this.trim(i.model) === this.trim(item.model))
      let _d = {
        ...item,
        frequency: 1
      }
      // eslint-disable-next-line no-unused-expressions
      find ? (find.number += item.number,find.price += item.price, find.frequency++) : obj.push(_d)
      return obj
    }, [])
    this.setState({
      bfExcelData: list,
      afExcelData: list2
    })
  }

  render() {
    const {
      bfExcelData,
      afExcelData,
      filesInfo,
    } = this.state
    return (
      <div className={styles.statistics}>
        <input type='file' accept='.xlsx, .xls' onChange={this.onImportExcel} />
        <div>
          数据总数：{bfExcelData.length} 条
        </div>
        <div>
          整合之后数据总数：{afExcelData.length} 条
        </div>
        <div>
          文件名称：{filesInfo.name}
        </div>
        <div>
          文件大小：{this.formatBytes(filesInfo.size)}
        </div>
      </div>
    )
  }

}

export default Statistics;
