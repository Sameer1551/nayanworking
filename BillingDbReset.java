import java.sql.*;
public class BillingDbReset {
  public static void main(String[] args) throws Exception {
    String url = "jdbc:mysql://localhost:3306/nayan-db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    try (Connection conn = DriverManager.getConnection(url, "root", "root")) {
      try (Statement st = conn.createStatement()) {
        st.execute("SET FOREIGN_KEY_CHECKS=0");
        st.execute("TRUNCATE TABLE billing_products");
        st.execute("TRUNCATE TABLE billing_records");
        st.execute("ALTER TABLE billing_products AUTO_INCREMENT=1");
        st.execute("ALTER TABLE billing_records AUTO_INCREMENT=1");
        st.execute("SET FOREIGN_KEY_CHECKS=1");
      }
      try (Statement st = conn.createStatement()) {
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_records")) {
          rs.next();
          System.out.println("billing_records rows after reset=" + rs.getInt(1));
        }
        try (ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM billing_products")) {
          rs.next();
          System.out.println("billing_products rows after reset=" + rs.getInt(1));
