#include "image_saver.hpp"

ImageSaver::ImageSaver(ros::NodeHandle* nh, string robot_name, string comms_prefix){
    try{
        nh_ = *nh;
        prefix_ = comms_prefix;
        nh_.getParam("image_dir", img_dir_);
        name_ = robot_name;

        img_sub = nh_.subscribe(prefix_ + robot_name + "/artifact_image_to_base", 1000, &ImageSaver::imageWriter, this);
        

    }catch(const std::exception& e){
        cout << "there was an error making the new image saver" << endl;
    }
}

ImageSaver::~ImageSaver(){
    images.clear();
}


bool ImageSaver::imageExists(float id){
    if(find(images.begin(), images.end(), id) != images.end()){
        return true;
    }
    return false;
}

void ImageSaver::imageWriter(marble_artifact_detection_msgs::ArtifactImg image){
    float img_id = image.image_id;
    if(!imageExists(img_id)){
        std::ofstream fout(img_dir_ + name_ + "/" + to_string(img_id) + ".png", std::ios::binary);
        fout << image.artifact_img;
        fout.close();
        images.push_back(img_id);
    }
}
