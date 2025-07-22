import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
  page: {
    backgroundColor:'#fff',
    color:'#262626',
    fontFamily:'Helvetica',
    fontSize:12,
    padding:"30px 50px"
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  header:{
    flexDirection:"row",
    justifyContent:"space-between",
    marginBottom:20,
  }
});