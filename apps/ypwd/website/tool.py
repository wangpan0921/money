from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time

def automate_element_operations():
    """
    自动化脚本：获取前端页面元素，修改class，并自动点击
    """
    
    # 1. 初始化浏览器驱动（这里以Chrome为例）
    # 需要先下载对应浏览器的驱动：https://chromedriver.chromium.org/
    driver = webdriver.Chrome()  # 或者使用其他浏览器：webdriver.Firefox(), webdriver.Edge()
    
    try:
        # 2. 打开目标网页
        driver.get("https://example.com")  # 替换为目标网址
        driver.maximize_window()  # 最大化窗口
        
        print("页面已打开，等待加载...")
        time.sleep(2)  # 等待页面加载
        
        # 3. 定位元素（多种定位方式示例）
        # 方式一：通过CSS选择器定位
        element_css = driver.find_element(By.CSS_SELECTOR, ".target-class")
        
        # 方式二：通过ID定位
        # element_id = driver.find_element(By.ID, "element-id")
        
        # 方式三：通过XPath定位
        # element_xpath = driver.find_element(By.XPATH, "//div[@class='target-class']")
        
        # 方式四：使用显式等待确保元素存在
        wait = WebDriverWait(driver, 10)
        element = wait.until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".target-class"))
        )
        
        print(f"找到元素: {element.tag_name}, 当前class: {element.get_attribute('class')}")
        
        # 4. 修改元素的class属性
        # 方法1: 使用JavaScript直接修改class
        driver.execute_script("""
            var element = arguments[0];
            element.className = "new-class-name";  // 完全替换
        """, element)
        
        # 方法2: 添加新的class（保留原有class）
        driver.execute_script("""
            var element = arguments[0];
            element.classList.add("additional-class");
        """, element)
        
        # 方法3: 移除特定class
        driver.execute_script("""
            var element = arguments[0];
            element.classList.remove("old-class");
        """, element)
        
        # 方法4: 切换class（存在则移除，不存在则添加）
        driver.execute_script("""
            var element = arguments[0];
            element.classList.toggle("active");
        """, element)
        
        # 等待修改生效
        time.sleep(1)
        
        print(f"修改后class: {element.get_attribute('class')}")
        
        # 5. 点击元素（多种点击方式）
        
        # 方式1: 普通点击
        element.click()
        print("普通点击完成")
        
        # 方式2: 使用JavaScript点击（适合元素被遮挡时）
        # driver.execute_script("arguments[0].click();", element)
        
        # 方式3: 使用ActionChains模拟更复杂的点击
        # actions = ActionChains(driver)
        # actions.move_to_element(element).click().perform()
        
        # 方式4: 双击操作
        # actions = ActionChains(driver)
        # actions.double_click(element).perform()
        
        # 6. 验证点击后的效果
        time.sleep(2)
        print("操作完成，页面已响应点击")
        
        # 可选：截屏保存结果
        driver.save_screenshot("after_click.png")
        
    except Exception as e:
        print(f"执行过程中出现错误: {str(e)}")
        
        # 发生错误时截屏
        driver.save_screenshot("error_screenshot.png")
        
    finally:
        # 7. 关闭浏览器
        input("按回车键关闭浏览器...")
        driver.quit()

# 高级功能：批量处理多个元素
def batch_process_elements():
    """批量处理多个元素"""
    driver = webdriver.Chrome()
    
    try:
        driver.get("https://example.com")
        
        # 查找所有符合条件的元素
        elements = driver.find_elements(By.CSS_SELECTOR, ".item")
        
        for idx, element in enumerate(elements):
            # 修改每个元素的class
            driver.execute_script(f"""
                arguments[0].className = "processed-item item-{idx}";
            """, element)
            
            # 点击每个元素
            element.click()
            time.sleep(0.5)  # 每次点击后稍作等待
            
            print(f"已处理第 {idx+1} 个元素")
            
    finally:
        driver.quit()

# 处理动态加载元素的示例
def handle_dynamic_elements():
    """处理需要等待的动态元素"""
    driver = webdriver.Chrome()
    
    try:
        driver.get("https://example.com")
        
        # 等待特定条件（如class变化、元素出现等）
        wait = WebDriverWait(driver, 20)
        
        # 等待元素出现
        element = wait.until(
            EC.presence_of_element_located((By.ID, "dynamic-element"))
        )
        
        # 等待元素的class包含特定值
        wait.until(
            lambda d: "loaded" in d.find_element(By.ID, "dynamic-element").get_attribute("class")
        )
        
        # 修改class
        driver.execute_script("""
            arguments[0].classList.add("interacted");
        """, element)
        
        # 点击
        element.click()
        
    finally:
        driver.quit()

if __name__ == "__main__":
    # 运行主函数
    automate_element_operations()
    
    # 如需运行批量处理，取消下面注释
    # batch_process_elements()
    
    # 如需处理动态元素，取消下面注释
    # handle_dynamic_elements()