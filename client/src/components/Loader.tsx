const Loader = ({
    size = 24,
    color = "#ffffff",
    className = "",
    text = "",
    textColor = "#ffffff",
}) => {
    const spinnerStyle = {
        width: size,
        height: size,
        borderColor: color,
        borderRightColor: "transparent",
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div
                className="inline-block animate-spin rounded-full border-4"
                style={spinnerStyle}
            />
            {text && <span style={{ color: textColor }}>{text}</span>}
        </div>
    );
};

export default Loader;