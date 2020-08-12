#include "image_saver.hpp"

ImageSaver::ImageSaver(ros::NodeHandle* nh, string robot_name, string prefix){
    try{
        nh_ = *nh;
        prefix_ = prefix;
        nh_.getParam("image_dir", img_dir_);
        name_ = robot_name;

        img_sub = nh_.subscribe(prefix_ + robot_name + "/image", 100, &ImageSaver::imageWriter, this);

        // make the necessary folder
        string dir = img_dir_ + name_;
        std::string path(dir);
        if(!boost::filesystem::exists(path)){
            boost::filesystem::create_directory(path);
        }

    }catch(const std::exception& e){
        cout << "there was an error making the new image saver" << endl;
    }
}

ImageSaver::~ImageSaver(){
    images.clear();
}


bool ImageSaver::imageExists(string id){
    if(find(images.begin(), images.end(), id) != images.end()){
        return true;
    }
    return false;
}

void ImageSaver::imageWriter(const marble_artifact_detection_msgs::ArtifactImg image){
    string artifact_id = name_ + "_" + to_string(image.artifact_id);
    if(!imageExists(artifact_id)){
        string img_path = img_dir_ + name_ + "/" + artifact_id + ".jpg";
        try{
            //convert compressed image data to cv::Mat
            cv::Mat conv_img = cv::imdecode(cv::Mat(image.artifact_img.data),1);
            cv::imwrite(img_path, conv_img);
            cout << "wrote image" << endl;

        }catch (cv_bridge::Exception& e){
            ROS_ERROR("Could not convert to image!");
        }

        images.push_back(artifact_id);
    }
}
